# Contexte

Lors d'une upgrade Spring Boot 2.7 à Spring Boot 3.5, un traitement qui récupère 5 000 000 de lignes en BDD est passé de 2 Go de RAM à 6 Go.

Le premier réflexe a été de comparer le SQL généré par Hibernate 5 et Hibernate 6. La requête était effectivement coûteuse : elle construisait un DTO contenant plusieurs références vers des objets associés.

# Requête initiale

Voici une version simplifiée de la requête :
```java
@Query("""
    SELECT new TablePrincipaleEntity(
        tp.a,
        tp.st1,
        tp.st2
    )
    FROM #{#entityName} tp
    """)
List<TablePrincipaleEntity> findAllCustom();
```
Ici, les champs 'a' 'b' et 'c' sont des associations. Ce ne sont pas des feuilles de l'entitée.
Hibernate a besoin de construire le sous objet complet, pour hydrater l'entitée principale, qui à remonter plus d'info que nécéssaire.


# Comparer le SQL généré

Hibernate 5 produit des requêtes mal optimisée, et à tendence à les multiplier pour récupérer toute la grappe d'objet :
```sql
SELECT tp.a FROM table_principale tp;
SELECT st1.x, st1.y, st1.z FROM sous_table_1 st1;
SELECT st2.x, st2.y, st2.z FROM sous_table_2 st2;
```

Hibernate 6 lui construit directement une seul requête propre, avec les jointure necessaires à la projection :
```sql
SELECT tp.a,
    st1.x, st1.y, st1.z,
    st2.x, st2.y, st2.z
FROM table_principale tp
INNER JOIN sous_table_1 st1
INNER JOIN sous_table_2 st2;
```

Remarque : on voit bien qu'il y a un petit problème avec la requête de Hibernate 6, mais qui est lié à la définition foireuse de TablePrincipaleEntity.  
L'entitée attends uniquement 1 champs particulier de chacunes sous table (pas expliqué dans l'exemple).  
Hibernate devroit donc récupérer 1 seul champs par sous table. Mais l'utilisation d'un Entité méga complexe comme projection de la requête fait que Hibernate doit absolument hidrater tous les champs (pas détaillé ici, mais sans constructeur différentiel sur les sous entitées, Hibernate fait le choix de tout remonter depuis les sous tables).  
Ce n'est pas nécéssairement lié au problème traité par cette note technique, mais ça participe à l'explosion de la RAM, car cela ramène forcément plus de valeurs dans le buffer.
Au final, il a été décidé de laisser la requête en l'état pour ce point et de nettoyer ça dans un second chantier.  


# Le SQL n'expliquait pas toute la mémoire

Même en affinant le nombre de donnée remontée par la requête, il n'y avait pas d'explication très clair sur l'origine exacte du problème.  
5 000 000 de ligne ça reste gourmant à traiter dans tous les cas, même si y a quelques champs inutiles en plus.  
Donc, fallait repenser différement au problème.  

Au final, au détour d'une suggestion de Gemini, j'ai eu l'ilumination : 
> Solution D : Ajuster la taille des paquets JDBC (Fetch Size)  
>Si vous chargez tout d'un coup, s'assurer que le driver JDBC utilise un découpage adapté pour ne pas saturer ses buffers réseau :  
> ```
> # Dans votre application.properties
> spring.jpa.properties.hibernate.jdbc.fetch_size=1000
> ```


# Limiter la lecture avec le fetch size

La correction a consisté à définir un fetch size. Cette indication demande au driver de récupérer les résultats par lots, plutôt que de tenter de mettre en mémoire un volume trop important d'un seul coup.

```java
import jakarta.persistence.QueryHint;
import org.hibernate.jpa.HibernateHints;
import org.springframework.data.jpa.repository.QueryHints;

@QueryHints(value = @QueryHint(
    name = HibernateHints.HINT_FETCH_SIZE,
    value = "10000"
))
@Query("""
    SELECT new TablePrincipaleEntity(
        tp.a,
        tp.st1,
        tp.st2
    )
    FROM #{#entityName} tp
    WHERE tp.st1.code >= :code
    """)
List<TablePrincipaleEntity> findAllCustom(
    @Param("code") String code
);
```


Enfin, un fetch size ne rend pas une `List` indépendante de la taille du résultat : les DTO finissent toujours tous en mémoire si la méthode retourne cinq millions d'éléments. Il limite la mémoire de lecture du `ResultSet` côté driver. Si le traitement doit aussi limiter la mémoire applicative, il faut traiter les résultats progressivement (flux ou pagination adaptée), fermer correctement les ressources et éviter de conserver tous les objets jusqu'à la fin.

# À retenir

- Une projection DTO qui reçoit des associations complètes peut entraîner la récupération de nombreuses colonnes et des jointures nécessaires.
- Le driver JDBC peut mettre en mémoire une grande partie du `ResultSet`. Le fetch size permet de piloter la lecture par lots, sous réserve du support et de la configuration du driver.
- Pour un traitement de plusieurs millions de lignes, il faut aussi vérifier que le code applicatif ne conserve pas l'ensemble du résultat.

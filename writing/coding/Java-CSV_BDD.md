# Contexte
/!\ les chiffres non siginficatifs (nombre de ligne du CSV par exmeple) sont arrondies pour simplifier les explications

Chargement de 2 fichiers CSV, dont un de 500 000 lignes :
- Le TF pose les fichier dans S3 et envoie une notif Kafka à l'application
- l'applicaiton consomme la notif et récupère le fichier depuis le S3
- l'application lie le CSV et envoie le Stream à une classe "utils" (DbUtils)
- la classe "utils" lie le fichier par bloc de 1000 lignes et les renvoie à l'application
- l'application les pousses en bases via un "jdbcTemplate.batchUpdate"

Le temps de traitement complet est de 1:10 sur ma machine (i5 + 32Go de RAM).

```
             ┌─ TF ────┐      ┌─ App ──────────┐      ╭─ BDD ─╮                           
             │         │      │                │      │▒▒▒▒▒▒▒│                           
             │  CSV ───┼──────┼─► □        □  ─┼────► │▒▒▒▒▒▒▒│                           
             │         │      │   │        ▲   │      ╰───────╯                           
             └─────────┘      └───┼────────┼───┘                                          
                                  │        │                                              
               ┌──────────────────┘        └──────────────────────┐                       
               ▼                                                  │                       
 ┌─ Common CSV ──────────────────┐    ┌─ Common─SQL───────────────┴─────────────────────┐ 
 │                               │    │                                                 │ 
 │  bstractS3CsvConsumerService ─┼────┼─► DbUtils                                       │ 
 │   - CSVParser                 │    │    - boucle sur le flux du CSVParser            │ 
 │                               │    │    - convertie les données en objet du modèle   │ 
 └───────────────────────────────┘    │    - ajoute la données à une liste              │ 
                                      │    - à 1000 éléments, la liste est sauvegardée  │ 
                                      └─────────────────────────────────────────────────┘ 
```


# Code initial (DbUtils)
Le code de découpage en bloc de 1000 élément est le suivant (code simplifié et commenté) : 
```java
public int process(final Stream<E> entityStream, final int chunkSize) {
  entityStream // Stream du CSVParser qui contient toutes les lignes du CSV
    .forEach(entity -> {
      processedCounter.incrementAndGet(); //compte le nombre de ligne traité
      
      final T value = processFunction.apply(entity); // convertie le CSVRecord en objet du model (pour le save)
      
      if (value != null) {
        valuesBuffer.add(value); // ajoute les éléments à la liste
      }
      
      if (valuesBuffer.size() >= chunkSize) { // le chunkSize vaut 1000
        save(); // on a nos 1000 items, on lance la sauvegarde
      }
    });
  
  if (!valuesBuffer.isEmpty()) {
    save(); // la méthode "save" vide la liste donc ce cas ne doit jamais arriver...
  }
  
  return processedCounter.get();
}
```

Plusieurs problèmes :
- les données sont lue séquentiellements (via un ForEach) mais l'ordre en base n'a pas d'importance
  - y a moyen de découper ça et faire des traitement par lot
- tant que les données sont envoyés à la base (via le save) il ne se passe rien
  - y a moyen de traiter les 1000 lignes suivantes en attendant
- la méthode de sauvegarde passe par le JdbcTemplate de SpringBoot
  - à priori le JdbcTemplate de Java est plus rapide


# 1ere optimisation : traitement des 1000 lignes en parallèle

Pas trop eu de bol en cherchant un moyen efficace de spliter la liste de données.  
Je demande à ChatGPT-4o :
> Je doit faire un calcul en parallèle en Java.  
> J'ai une liste de 500000 éléments.  
> Je fait un "foreach" sur la liste et réalise une sauvegarde en base tout les 1000 éléments (avec un batchupdate).  
> 
> Il faudrait que j'accélère ce traitement.  
> Les données peuvent être insérées en base dans n'importe quel ordre.

Le code ressemble à peut prêt à ça :
```java
public int process(final Stream<E> entityStream, final int chunkSize) {
  // ▼▼▼ CODE NON FOURNIT PAR CHATGPT ▼▼▼
  // map les objets vers le type accepté par la méthode de sauvegarde
  final List<T> list = entityStream
    .map(processFunction)
    .parallel() // <- petit optimisation qui va évidement n'avoir AUCUN impact sur la suite...
    .toList();
  // ▲▲▲ CODE NON FOURNIT PAR CHATGPT ▲▲▲

  // Diviser la liste en sous-listes (batches)
  final List<List<T>> batches = partitionList(list, BATCH_SIZE); // méthode pas détaillée, mais vous voyez l'idée...

  // Créer un pool de threads pour traiter les batchs en parallèle
  ExecutorService executorService = Executors.newFixedThreadPool(THREAD_POOL_SIZE);

  for (List<T> batch : batches) {
    executorService.submit(() -> saveFunction.apply(batch));
  }

  // Attendre que toutes les tâches soient terminées
  executorService.shutdown();
  try {
    executorService.awaitTermination(Long.MAX_VALUE, TimeUnit.NANOSECONDS);
  } catch (InterruptedException e) {
    e.printStackTrace();
  }
  return ...;
}
```

Résultats :
| | avant | après | Commentaire
|---|---|---|---|
| Temps | **0:01:10**| **0:00:40** | joli gain, sans être incroyable
| Heap | 250Mo | +2Go | la ça fait mal
| Thread | 1 | 10 |


# 2eme optimisation : changement du JdbcTemplate
Le code de sauvegarde utilise le `JdbcTemplate.batchUpdate` de SpringFramework (`org.springframework.jdbc.core`).  
Dans notre cas, les performances ne sont pas optimales :  
- on fait 1000 enregistrements sur 10 Threads
- Malgré l'utilisation du PreparedStatement en fond, il n'y a pas de gestion de transaction
- on fait donc autant de commit en base que de Threads 

Implémenter le PreparedStatement nous même permet de reprendre la main sur la gestion des commit en base.  
Cf implémentation de cet article : https://www.codejava.net/java-se/jdbc/jdbc-batch-update-examples

```java
public int save(final List<Pcr> pcrs) {
  final DataSource dataSource = jdbcTemplate.getDataSource();
  if (dataSource == null) {
    throw new NoSuchElementException("Problème lors de la récupération de la DataSource");
  }

  int[] result;

  try (final Connection connection = dataSource.getConnection();
       PreparedStatement statement = connection.prepareStatement(saveSql)) { // "saveSql" est juste un INSERT avec des paramètres anonymes '?'
    // on commit uniquement lorsque le batch complet a été joué
    connection.setAutoCommit(false);

    // boucle sur le lot de PCR (pré-découpée par la méthode "proces")
    for (Pcr pcr : pcrs) {
      final Object[] objectArray = toObjectArray(pcr);
      for (int i = 0; i < objectArray.length; i++) {
        // ajoute chaque objet avec sont type attendus en BDD
        statement.setObject(i + 1, objectArray[i], DATA_TYPE[i]);
      }
      statement.addBatch();
    }
    result = statement.executeBatch();
    connection.commit();
  } catch (SQLException e) {
    log.warn("Problème lors de l'enregistrement en base");
    throw new TechnicalException("Problème lors de l'enregistrement en base", e);
  }
  // il n'y a qu'une commande "INSERT" par batch, donc on a juste
  // besoin de compter le nombre de lignes dans le tableau
  return result.length;
}
```

Résultats :
| | avant | après | Commentaire
|---|---|---|---|
| Temps | **0:00:40** | **0:00:20** | on peut pas faire beaucoup mieu
| Heap | +2Go | +2Go | toujours en caraffe (normal, on y a pas touché)
| Thread | 1 | 10 |


# Réduction de l'empreinte mémoire
Première tentative :
```java
final List<T> list = entityStream
  .map(processFunction)
  .parallel()
  .toList();

// Obtenir un itérateur sur la liste pour éviter la création de sous-listes
Iterator<T> iterator = list.iterator();

while (iterator.hasNext()) {
  // Construire un batch de BATCH_SIZE éléments
  List<T> batch = getNextBatch(iterator, BATCH_SIZE);
  
  // Soumettre chaque batch à un thread pour traitement
  executorService.submit(() -> saveFunction.apply(batch));
}
//reste du code...
```
Problème : on crée les sous listes à l'exterieur du `executorService`, ce qui pourrait expliqué pourquoi la conso mémoire ne change pas

Deuxième tentative :
```java
final List<T> list = entityStream
  .map(processFunction)
  .parallel()
  .toList();

// Obtenir un itérateur sur la liste pour éviter la création de sous-listes
Iterator<T> iterator = list.iterator();

// Soumet autant de tâche que de Thread
for (int i = 0; i < THREAD_POOL_SIZE; i++) {
  executorService.submit(() -> {
    while (true) {
      List<T> batch = new java.util.ArrayList<>();
      int count = 0;

      // Bloc synchronisé pour éviter les doubles sauvegarde en base (race condition).
      // Le bloc n'est executé que par 1 Thread à la fois.
      synchronized (iterator) {
        // liste de donnée instanciée à la demande pour limiter la conso mémoire
        while (iterator.hasNext() && count < BATCH_SIZE) {
          final T value = processFunction.apply(iterator.next());
          batch.add(value);
          count++;
        }
      }
      if (batch.isEmpty()) {
        break;  // pas de données à traiter, on termine la tâche
      }
      saveFunction.apply(batch);  // lance la sauvegarde avec le batch de données
    }
  });
}
//reste du code...
```
Problème : la conso ne diminue toujour pas.  
On est à 1,5Go au lieu de 2Go, mais ça reste toujours énorme.  
La où j'ai commencé à avoir des doute, c'est que la mémoie restait à 1,5go alors que je baissait le nombre de Thread.  
Même avec 1 Thread on avait le problème... Le soucis vient donc d'ailleurs.

Résolution : 
```diff
--final List<T> list = entityStream
--  .map(processFunction)
--  .parallel() // <- Cette méthode ne limite pas sont utilisation de la mémoire
--  .toList();

// Obtenir un itérateur sur la liste pour éviter la création de sous-listes
--Iterator<T> iterator = list.iterator();
++Iterator<T> iterator = entityStream.iterator();
```

Résultats :
| | avant | après | Commentaire
|---|---|---|---|
| Temps | 0:00:20 | 0:00:35 | on perd un peu de perfs
| Heap | **250Mo** | **300Mo** | conso mémoire limitée
| Thread | 1 | 4 | bon compromis temps/mémoire


# Conslusion
Tentative d'explication de l'algo (à retravailler ?) :
```
                        ┌─────────────────────────┐                      
                        │ Création d'autant de    │                      
                        │ Thread que possible     │                      
┌─ CSV ────────┐        └─────────┬───────────────┘                      
│              │                  │                                      
│  ----------  │              ┌───┴───────────────┐                      
│  ----------  │              │                   │                      
│  ----------  │              ▼                   ▼                      
│  ----------  │        ┌─ Thd 1 ───┐       ┌─ Thd 2 ───┐                
│  ----------  │        │  .......  │       │  .......  │                
│  ----------  │......... ►:add  :  │........► :add  :  │                
│  ----------  │        │  :.....:  │       │  :.....:  │                
│  ----------  │        │     ▼     │       │     ▼     │                
│              │        │  ┌─────┐  │       │  ┌─────┐  │      ╭─ BDD ─╮ 
└──────────────┘        │  │save │~~~~~~~~~~│  │save │  │~~~~~►│▒▒▒▒▒▒▒│ 
                        │  └─────┘  │       │  └─────┘~~~~~~~~►│▒▒▒▒▒▒▒│ 
                        └─────┬─────┘       └─────┬─────┘      ╰───────╯ 
                              │                   │                      
                              └───┬───────────────┘                      
                                  │                                      
                                  ▼                                      
                        ┌─────────────────────────┐                      
                        │ Attente de la fin des   │                      
                        │ Threads                 │                      
                        └─────────────────────────┘                      
```

Remarque : la conso mémoire est conditionnée par le nombre de Thread.


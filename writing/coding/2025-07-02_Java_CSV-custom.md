# Contexte
Retour sur une histoire à rebondissements.

L'objectif est d'ajouter le traitement d'un nouveau fichier CSV dans un projet déjà en place.

Éléments de contexte :
- un parsing CSV existe déjà pour les fichiers générés chez nous  
- l'objectif est de traiter un nouveau CSV (généré par une autre équipe)  
- son format est nécessairement différent


# Lecture d'un CSV
Comme tout projet à l'arache, il nous faut de la souplesse dans les structures de données.  
Le projet a donc été pensée pour faire évoluer rapidement le format des CSV, en cas d'imprévu.  
On va le voir plus tard, ça n'aura jamais été utilisé.  

Pour lire le CSV, on utilise la librairie `apache.commons.csv` :
```java
// Classe dédiée aux éléments statiques
@NoArgsConstructor(access = AccessLevel.PRIVATE)
public class Constante {
    // le CSVFormat permet de configurer facilement le parser.
    public static final CSVFormat CSV_FORMAT = CSVFormat
            .DEFAULT
            .builder()
            .setNullString("")
            .setDelimiter(";") // délimiteur de colonne
            .setRecordSeparator("\n") // délimiteur de ligne
            .setHeader()
            .setSkipHeaderRecord(true)
            .build();
}
```

Ce format est réutilisé pour la création du parser :
```java
public void processIntegration() {
    try (// récupération du fichier (format abrégé pour l'exemple)
         final BufferedReader bufferedReader = getContentBuffer();
         // création du parser à partir du format
         final CSVParser csvParser = new CSVParser(bufferedReader, Constante.CSV_FORMAT)) {
        final List<String> headers = csvParser.getHeaderNames();
        Flux.fromIterable(csvParser)
        ...
    } catch (IOException e) {
        ...
    }
}
```

Le format du CSV ressemble à : `-----;-----;-----`


# Le nouveau CSV
Après quelques ajustements de routine, le traitement du nouveau CSV tombe en erreur :  
```
{"erreurIntegrationFichiers":["IOException reading next record: java.io.IOException: (line 1513608) invalid char between encapsulated token and delimiter"]}
```
Après analyse, le format ressemble à : `"-----";"--"--";"--;--"`

🚨on a 2 choses très bizarre :  
- les points-virgules apparaissent dans les données : les champs doivent donc être encadrés par des guillemets
- problème : les guillemets doubles `"` ne sont pas échapés à l'intérieur des champs
  - la norme RFC suggère de les échaper en les doublonnant (`""`)


# Solution insoluble ?
Deux contraintes entrent en jeu :
- faire corriger l'échappement des guillemets doubles est "difficile" 
  - traduction : certaines personnes font pas leur taf
- le délimiteur `;` doit être conservé pour faciliter l'ouverture du CSV dans Excel.
  - traduction : Microsoft n'as pas d'argent pour coder un bon produit

La solution de contournement consiste donc à passer par un code custom.  
Le découpage des lignes devra se faire avec le délimiteur `";"` :  
```java
public void processIntegration() {
    try (// récupération du fichier (format abrégé pour l'exemple)
         final BufferedReader bufferedReader = getContentBuffer();
         // création du parser en fonction du format
         final CSVParser csvParser = new CSVParser(bufferedReader, Constante.CSV_FORMAT)) {
        final String firstLine = bufferedReader.readLine();
        final List<String> headers = parseLineAndSplit(firstLine, ";");

        Flux.fromStream(bufferedReader.lines())
            .doOnEach(stringSignal -> ... )
        ...
    } catch (IOException e) {
        ...
    }
}

private List<String> parseLineAndSplit(final String line, final String delimiter) {
    // On enlève les guillemets en début et fin de ligne
    String cleanLine = line;
    if (cleanLine.startsWith("\"")) {
        cleanLine = cleanLine.substring(1);
    }
    if (cleanLine.endsWith("\"")) {
        cleanLine = cleanLine.substring(0, cleanLine.length() - 1);
    }
    // Ensuite, on découpe
    return Arrays.asList(cleanLine.split(delimiter));
}
```

# Bonus (pas au bon endroit) : Mock avec explicit type witness
On prends comme exemple, une méthode du framework qui prends un type générique :  
```java
//      ╭ déclaration du type générique
//      │  ╭ type de retour                       ╭ retourne un objet générique
public <T> T query(String sql, ResultSetExtractor<T> rse, @Nullable Object... args) throws DataAccessException {
    return this.query(sql, this.newArgPreparedStatementSetter(args), rse);
}
```

Dans le code, ont choisit de lui faire retourner est une liste :
```java
jdbcTemplate
.query("SELECT column_name FROM ...",
    // ici, le ResultSet est converti en liste.
    (ResultSet rs) -> {
        final List<String> result = new ArrayList<>();
        while (rs.next()) {
            result.add(rs.getString("column_name"));
        }
        return result;
    },
    tableName.toUpperCase());
```

Pour Mocker ça correctement, il faut indiquer explicitement que le `ResultSetExtractor` produit bien une `List<String>` :
```java
//                                      ╭ appel de méthode générique explicite
//                                      │             ╭ type attendu par la méthode générique
//                                      │             │            ╭ type de retour du générique
when(jdbcTemplate.query(anyString(), Mockito.<ResultSetExtractor<List<String>>>any(), any()))
    .thenReturn(List.of("value1", "value2"));
```

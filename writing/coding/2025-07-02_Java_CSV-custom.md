# Contexte
Retour sur une histoire à rebondissements.

L'obectif est d'ajouter le traitement d'un nouveau fichier CSV, sur un projet déjà en place.  
Eléments de contexte : 
- il y a déjà un parsing CSV en place (les fichiers sont générés chez nous)
- l'objectif est de traiter un nouveau CSV (généré par une autre équipe)
- et le format sera nécéssairement différent...


# Lecture d'un CSV
Comme tout projet à l'arache, il nous faut de la souplesse dans les structures de données.  
Le projet a donc été pensée pour faire évoluer rapidement le format des CSV, en cas d'imprévu.  
On va le voir plus tard, ça n'aura jamais été utilisé.  

Pour lire efficacement le CSV, on met à profit la librairie `apache.commons.csv` : 
```java
// Classe dédiée aux éléments statiques
@NoArgsConstructor(access = AccessLevel.PRIVATE)
public class Constante {
    // le CSVFormat permet de facilement configurer notre parser
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

Ce code est réutilisé à la création du parser : 
```java
public void processIntegration() {
    try (// récupération du fichier (format abrégé pour l'exemple) 
         final BufferedReader bufferedReader = getContentBuffer();
         // création du parser en fonction du format
         final CSVParser csvParser = new CSVParser(bufferedReader, Constante.CSV_FORMAT)) {
        final List<String> headers = csvParser.getHeaderNames();
        Flux.fromIterable(csvParser)
        ...
    } catch (IOException e) {
        ...
    }
}
```

Le format du CSV est de ce type : `-----;-----;-----`


# Le nouveau CSV
Après quelques ajustement de routines, le traitement du nouveau CSV tombe en erreur :  
```
{"erreurIntegrationFichiers":["IOException reading next record: java.io.IOException: (line 1513608) invalid char between encapsulated token and delimiter"]}
```
Après analyse, le format ressemble à ça : `"-----";"--"--";"--;--"`

🚨on a 2 choses très bizarre :  
- les points-virgules apparaisent dans les données, on a donc besoin des guillemets englobant
- problème : les guillemets doubles `"` ne sont pas échapés à l'intérieur des champs
  - la norme RFC suggère de les échaper en les doublonnant


# Solution insoluble ?
Il y a 2 contraintes très imporante qui rentre en jeu :  
- l'échapement des guillemets doubles est lourd à mettre en place, donc on abadonne
- le délimiteur `;` n'est pas modifiable pour faciliter les ouvertures des CSV dans Excel

La solution de contournement consiste donc à passer par un code custom.  
Le code devra faire le découpage des lignes avec le délimiteur `";"` :  
```java
public void processIntegration() {
    try (// récupération du fichier (format abrégé pour l'exemple) 
         final BufferedReader bufferedReader = getContentBuffer();
         // création du parser en fonction du format
         final CSVParser csvParser = new CSVParser(bufferedReader, Constante.CSV_FORMAT)) {
        final String firstLine = bufferedReader.readLine();
        final List<String> headers = parseLineAndSplit(firstLine, ";");

        Flux.fromIterable(() -> bufferedReader.lines().iterator())
        ...
    } catch (IOException e) {
        ...
    }
}

private List<String> parseLineAndSplit(final String line, final String delimiter) {
    String cleanLine = line;
    // On enlève les guillemets en début et fin de ligne
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

# Bonus : Mock avec explicit type witness
Exemple de méthode :  
```java
//      ╭ déclaration du type générique
//      │  ╭ type de retour                       ╭ retourne un objet générique
public <T> T query(String sql, ResultSetExtractor<T> rse, @Nullable Object... args) throws DataAccessException {
    return this.query(sql, this.newArgPreparedStatementSetter(args), rse);
}
```
Concernant l'utilisation de la méthode, on voit un changement de type sur le 
```java
jdbcTemplate
.query("SELECT column_name FROM ...",
    // ici, le ResultSet retourne une LIST
    (ResultSet rs) -> {
        final List<String> result = new ArrayList<>();
        while (rs.next()) {
            result.add(rs.getString("column_name"));
        }
        return result;
    },
    tableName.toUpperCase());
```
Mock :  
```java
//                                      ╭ appel de méthode générique explicite
//                                      │             ╭ type attendu par la méthode générique
//                                      │             │            ╭ type de retour du générique
when(jdbcTemplate.query(anyString(), Mockito.<ResultSetExtractor<List<String>>>any(), any()))
    .thenReturn(List.of("value1", "value2"));
```

# Contexte

Optimisation de la lecture d'un fichier Excel `.xlsx` (format OOXML) en Java, depuis un repo S3.  

# Chargement depuis S3
La récupération du fichier depuis S3 avec l'API pose des soucis de performance si le fichier est gros :
```java
try (final InputStream inputStream = s3Service.getContentInputStream(s3Path.bucket(), s3Path.objectPath());) {
  return OPCPackage.open(inputStream);
}
```
L'appel à `OPCPackage.open` fait que **le fichier complet est téléchargé en mémoire** -> pas bon du tout.   
OPCPackage est un objet mis à dispo par Apache POI.

Correction :
```java
try (final InputStream inputStream = s3Service.getContentInputStream(s3Path.bucket(), s3Path.objectPath())) {
  // copie en fichier temporaire
  Files.copy(inputStream, tempFileFromS3.toPath(), StandardCopyOption.REPLACE_EXISTING);
  return OPCPackage.open(tempFileFromS3, PackageAccess.READ);
}
```

Code un peu plus opti (mais qui causait des erreurs 400 en prod...) : 
```java
final GetObjectRequest objectRequest = new GetObjectRequest(s3Path.bucket(), s3Path.objectPath());

// télécharge l'objet depuis S3 vers le fichier temporaire
final TransferManager transferManager = TransferManagerBuilder.standard().withS3Client(s3Service.getAmazonS3()).build();
final Download download = transferManager.download(objectRequest, tempFileFromS3);

// pendant le chargement du fichier, on log tous les 10% d'avancement (code d'exemple)
int progressValue;
int loggedValue = 0;
while (!download.isDone()) {
  progressValue = (int) download.getProgress().getPercentTransferred();
  if (progressValue > loggedValue && progressValue % 10 == 0) {
    log.info("Download... {}", download.getProgress().getPercentTransferred());
    loggedValue = progressValue;
  }
}

// création de OPCPackage à partir du fichier
return OPCPackage.open(tempFileFromS3, PackageAccess.READ);
```
Charger la resource S3 dans un fichier temporaire évite le débordement de la mémoire.


# Lecture du Excel via l'API Stream
L'API événementielle de POI évite de construire un `XSSFWorkbook` complet :
- `XSSFReader` ouvre les feuilles du fichier `.xlsx` une par une.
- Un parseur SAX lit le XML de chaque feuille.
- `XSSFSheetXMLHandler` transforme les événements en callbacks de ligne et de cellule.

Structure minimale du parcours :
```java
try (OPCPackage opcPackage = OPCPackage.open(tempFile.toFile(), PackageAccess.READ)) {
  // on utilise XSSFReader pour récupérer les parties du fichier qui nous intéressent
  final XSSFReader reader = new XSSFReader(opcPackage);
  // table contenant toutes les chaînes de caractères du fichier (sans doublons)
  final SharedStrings strings = new ReadOnlySharedStringsTable(opcPackage, true);
  // table contenant tous les styles de la feuille (utile pour le format des données)
  final StylesTable styles = reader.getStylesTable();
  // Itérateur des feuilles du fichier
  XSSFReader.SheetIterator sheets = (XSSFReader.SheetIterator) reader.getSheetsData();
  // création du parser SAX
  XMLReader parser = XMLHelper.newXMLReader();

  while (sheets.hasNext()) {
    try (InputStream sheet = sheets.next()) {
      // handler des données XML remontées par le parseur SAX (qui sont ensuite gérées par le Consumer)
      ContentHandler sheetHandler = new XSSFSheetXMLHandler(
          styles, strings, rowHandler, new DataFormatter(), false);
      // enregistre le handler auprès du parser
      parser.setContentHandler(sheetHandler);
      // lance le parsing du fichier
      parser.parse(new InputSource(sheet));
    }
  }
}
```
Les données sont effectivement traitées par le `rowHandler` qui contient les méthodes appelées par le callback.  

Le mode Stream réduit surtout la mémoire pour les lignes. La SharedStringTable (qui contient toutes les chaînes dédupliquées) reste en mémoire.





# Ressources
- diff entre XSSF et HSSF : https://poi.apache.org/components/spreadsheet/
- exemple d'implémentation HSSF : https://svn.apache.org/repos/asf/poi/trunk/poi-examples/src/main/java/org/apache/poi/examples/hssf/eventusermodel/XLS2CSVmra.java
- exemple d'implémentation XSSF : https://svn.apache.org/repos/asf/poi/trunk/poi-examples/src/main/java/org/apache/poi/examples/xssf/eventusermodel/XLSX2CSV.java

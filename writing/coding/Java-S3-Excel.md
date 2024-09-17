# Contexte

Optimisation de la lecture d'un fichier Excel en Java, depuis un repo S3.

# Chargement depuis S3
La récupération du fichier depuis S3 avec l'API pose des soucis de performance si le fichier est gros :
```java
try (final InputStream inputStream = s3Service.getContentInputStream(s3Path.bucket(), s3Path.objectPath());) {
  return OPCPackage.open(inputStream);
}
```
L'appel à `OPCPackage.open` fait que **le fichier complet est télécharger en mémoire** -> pas bon du tout
OPCPackage est un objet mis à dispo par Apache POI.

Correction :
```java
try (final InputStream inputStream = s3Service.getContentInputStream(s3Path.bucket(), s3Path.objectPath())) {
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

// pendant le chargement du fichier, on log tous les 10% d'avancement
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
Principe : 
  - XSSF génère des évènements XML
  - SAX parse les données
  - Un objet `ContentHandler` traite la donnée

Process :
  - XSSFReader.SheetIterator (pour boucler sur les feuilles)
    - XMLReader (parseur SAX)
      - ContentHandler (récupère les données du parser SAX et les envoi au `consumer`)
        - `consumer` pour chaque ligne de la feuille



# @SpringBootTest
- `@Autowired` :
  - injecte le bean du contexte Spring
- `@MockitoBean` :
  - crée un mock et l'injecte dans le contexte
  - remplace le bean correspondant pour le test
- `@MockitoSpyBean` :
  - enveloppe un bean du contexte dans un spy, qui appelle les méthodes réelles par défaut
  - permet d'utiliser `verify`, `ArgumentCaptor` ou `doReturn`

# Tips & Tricks
## Appeler une méthode réelle sur un mock
Pour exécuter réellement une méthode d'un mock :
```java
when(myService.myMethod(any(Runnable.class), anyString())) // possible aussi avec "doAnswer"
  .thenAnswer(invocation -> {
    Runnable r = invocation.getArgument(0);
    r.run(); // Exécute la tâche directement
    return null;
  });

// ou bien comme ça :
doCallRealMethod().when(myService)
                  .myMethod(any(Runnable.class), anyString());
```

## Injection par réflexion
Dans un test unitaire sans contexte Spring, si une méthode réelle appelée sur un mock a besoin d'un champ, il faut l'injecter :
```java
ReflectionTestUtils.setField(myService, "myProperty", new MyProperty());
```

## Charger les ressources de test
Utiliser l'utilitaire Spring dédié à ça : 
```java
ResourceUtils.getFile("classpath:filename.json"));
```

## Imbrication de plusieurs objets
Si on a une imbrication de services qu'on ne veut pas mocker, Mockito ne construit pas tout le graphe comme le ferait Spring : il faut le faire à la main.
```java
@Mock
MonRepository monRepository;
@InjectMocks
MonServiceSimple monServiceSimple; // service non mocké (contient une ref à MonRepository)

MonService monService; // Objet de base des tests (contient une ref à MonServiceSimple)
@BeforeEach
void setUp() {
    // injection de dépendances multi-niveau à la main (pas gérée par Mockito)
    monService = new MonService(monServiceSimple);
}
```
C'est partique si un service est sur-découpé avec des services très simples.  
On test 2 couches d'un coup (normalement, ça veut dire qu'il faut revoir la structure du code).

## Capturer les messages de log
Ajouter l'annotation à la classe :  
```java
@ExtendWith(OutputCaptureExtension.class)
```
Pour l'injecter automatiquement dans le test :  
```java
@Test
@DisplayName("my test")
void myTest(final CapturedOutput capturedOutput) {
  //...
  assertThat(capturedOutput.getOut()).contains("some text...");
}
```

## Captor avec typage complexe
```java
ArgumentCaptor<List<Object[]>> batchCaptor = ArgumentCaptor.forClass(List.class); // warning, mais c'est pour l'exemple
verify(jdbcTemplate, times(3)).batchUpdate(anyString(), batchCaptor.capture());
final List<Object[]> value = batchCaptor.getAllValues().stream().flatMap(List::stream).toList();
assertThat(value).hasSize(3)
                 .containsExactly(
                         new Object[]{ "A1", "A2" },
                         new Object[]{ "B1", "B2" },
                         new Object[]{ "C1", "C2" }
                 );
```


# @SpringBootTest
- utiliser `@Autowired` pour tester les services
- `@MockBean` :
  - crée un mock Mockito et l'injecte automatiquement dans le contexte Spring
  - remplace le bean réel par ce mock pour toute la durée du test

# Tips & Tricks
## Call real method
Si on veut executer réellement une méthode d'un objet mocké, par exemple avec une classe qui prend un `Runnable` :  
```java
when(myService.myMethod(any(Runnable.class), anyString())) // possible aussi avec "doAnswer"
  .thenAnswer(invocation -> {
    Runnable r = invocation.getArgument(0);
    String s = invocation.getArgument(1);
    r.run(s); // Exécute la tâche directement
    return null;
  });

// ou bien comme ça :
doCallRealMethod().when(myService)
                  .myMethod(any(Runnable.class));
```

## Injection par reflexivitée
Dans le cas où on est pas dans un `@SpringBootTest`.  
Si on veut appeler réellement une méthode sur un `@Mock`, il faut lui injecter ses propriétées :  
```java
ReflectionTestUtils.setField(myService, "myProperty", new MyProperty());
```

## Charger les ressources de test
Utiliser l'utilitaire Spring dédié à ça : 
```java
ResourceUtils.getFile("classpath:filename.json"));
```

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


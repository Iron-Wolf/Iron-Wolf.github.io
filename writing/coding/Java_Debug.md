# Analyser les options JVM
- lister les process JVM
  - `jcmd`
- options d'un process
  - `jcmd <PID> VM.flags`
  - `jcmd <PID> VM.command_line`
  - `jinfo -flag MaxHeapSize <PID>`
  - `jhsdb jmap --heap --pid <PID>`

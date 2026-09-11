# @topla/mobile

Каркас React Native приложения. `android/` и `ios/` — нативные проекты — **не
хранятся здесь** до ШАГ 13 (`docs/mvp-roadmap.md`), т.к. генерируются
инструментами React Native CLI и специфичны для машины/CI, на которой
выполняется сборка.

Инициализация нативных папок при переходе к ШАГ 13:

```bash
npx @react-native-community/cli@latest init TmpInit --skip-install
# скопировать сгенерированные android/ и ios/ в apps/mobile/,
# подключив существующие package.json, App.tsx, index.js, tsconfig.json
```

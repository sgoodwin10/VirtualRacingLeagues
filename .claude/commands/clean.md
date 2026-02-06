## Backend
Check all php files and look to fix any unused variables, files, functions, fully qualified domain names, domain logic etc. Run phpstan, Larastan, phpcs and phpcbf on all the backend files. 

## Frontend ##
Check all vuejs, ts, js files and look for any unused variables, incorrect imports, duplicate code, files, functions, etc, and fix and update. Run all linters and prettiers.

#### Automated Verification:
- [ ] No linting errors: `composer run phpcs`
- [ ] Static analysis passes: `composer run phpstan`
- [ ] Jvascript/Typescript ESLint analysis passes: `npm run lint` and `npm run lint:fix`
- [ ] Jvascript/Typescript Formatting passes: `npm run format`

## When finished
run the command `/test.md`
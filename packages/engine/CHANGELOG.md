# Change Log

All notable changes to this project will be documented in this file.
See [Conventional Commits](https://conventionalcommits.org) for commit guidelines.

## [6.0.0-alpha.0](https://github.com/Alwatr/store/compare/v5.1.0...v6.0.0-alpha.0) (2024-01-15)

### Miscellaneous Chores

* **deps:** update ([8f3edcf](https://github.com/Alwatr/store/commit/8f3edcf8a489927a6c43dfcaa5db88a579ecac80)) by @

## [5.1.0](https://github.com/Alwatr/store/compare/v5.0.0...v5.1.0) (2024-01-13)

**Note:** Version bump only for package @alwatr/store-engine

# [5.0.0](https://github.com/Alwatr/store/compare/v5.0.0-beta...v5.0.0) (2024-01-12)

### Code Refactoring

* **engine:** remove all string id from public api ([c44fd1c](https://github.com/Alwatr/store/commit/c44fd1c0a7daffe20ba9e836f23d63a4dd4250b8)) by @AliMD

### Features

* **engine:** use alwatr exit hook ([5be4f01](https://github.com/Alwatr/store/commit/5be4f01bc746b5b4cfb1df10def3abc5632c44ee)) by @njfamirm
* **store:** Add option to error when store not initialized ([4b27468](https://github.com/Alwatr/store/commit/4b27468a063027b357e27fdff2484932e23d46e0)) by @AliMD

### BREAKING CHANGES

* **engine:** The string ID has been removed from public APIs to prevent confusion caused by a simple sting ID.

# [5.0.0-beta](https://github.com/Alwatr/store/compare/v4.1.0...v5.0.0-beta) (2023-12-31)

### Bug Fixes

* **deps:** dev deps ([b129567](https://github.com/Alwatr/store/commit/b12956768b9d60a75c0fdc43774512b86b655f78)) by @AliMD
* **engine/demo:** benchmark ([48b4456](https://github.com/Alwatr/store/commit/48b4456cd09bf610bfe718c843e55ff0db2a9e5a)) by @njfamirm
* **engine/demo:** import path ([6effc2c](https://github.com/Alwatr/store/commit/6effc2c105aaf4057581bc161723d59a7ea0b7e6)) by @njfamirm
* **engine:** add types to deps ([170043d](https://github.com/Alwatr/store/commit/170043d9095c73e3c678c051bc3f34d2ccd43730)) by @njfamirm
* **engine:** data loss issue and improve performance ([07f6877](https://github.com/Alwatr/store/commit/07f68777faec66fee4efae7afd340bebe7078f17)) by @AliMD
* **engine:** file path ([bbc4abd](https://github.com/Alwatr/store/commit/bbc4abdbb601108dc91ee95eeaac5cbbc272cdd4)) by @njfamirm
* **engine:** get collection issue ([742aa23](https://github.com/Alwatr/store/commit/742aa236ae98c934ea6e0904a8a91d152471a31a)) by @AliMD
* **engine:** import type ([9f67871](https://github.com/Alwatr/store/commit/9f67871dba8528a5393ea372f136865c952a102c)) by @njfamirm
* **engine:** Remove StoreFileStatModel class ([d47b680](https://github.com/Alwatr/store/commit/d47b680d54b8bd9a0b8926653a69cb59c8f36398)) by @AliMD
* **engine:** unsaved data lost issues ([fec0bef](https://github.com/Alwatr/store/commit/fec0bef78ac67ddd669012d8804588883f39affa)) by @AliMD
* **engine:** Update defaultChangeDebounce value in AlwatrStore ([63edd08](https://github.com/Alwatr/store/commit/63edd08c87c675edb91b8f7aa61b901a6d1db111)) by @AliMD
* **engine:** Update imports and refactor util.ts ([2b1f962](https://github.com/Alwatr/store/commit/2b1f9628f4578f707996fe5e6d5d92c7d093b615)) by @AliMD

### Features

* **engine/demo:** collection with new api ([f603e86](https://github.com/Alwatr/store/commit/f603e86d2827c66219321f9df400049e76b78c21)) by @AliMD
* **engine:** Add data-lost-test.js demo file ([673f324](https://github.com/Alwatr/store/commit/673f3247c4b6c1bca2f9e9d9169843ca6a5e9804)) by @AliMD
* **engine:** debounce for save file ([c92749e](https://github.com/Alwatr/store/commit/c92749e83352129c02130ac2466dd5acda289795)) by @AliMD
* **engine:** doc demo ([f49f78b](https://github.com/Alwatr/store/commit/f49f78bd3b5942406fe74e273e87bcbf12f67c4f)) by @njfamirm
* **engine:** enhance benchmark demo ([200da18](https://github.com/Alwatr/store/commit/200da18cd9542fa4182f910c0ad813703326fe38)) by @AliMD
* **engine:** impediment exit hook ([68695a9](https://github.com/Alwatr/store/commit/68695a975e0ec6c473bbd2d9a62c81720f090352)) by @AliMD
* **engine:** Refactor code to improve performance and readability ([b4c0848](https://github.com/Alwatr/store/commit/b4c0848e7518ae5c96e8ab7643716a2e923f7635)) by @AliMD
* **node-fs:** Update logger method arguments to include truncated path ([8c6f49a](https://github.com/Alwatr/store/commit/8c6f49ad56d5667ba1280a5d28b7a39b21c3a11a)) by @AliMD

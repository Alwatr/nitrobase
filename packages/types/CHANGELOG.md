# Change Log

All notable changes to this project will be documented in this file.
See [Conventional Commits](https://conventionalcommits.org) for commit guidelines.

## [6.0.0-alpha.0](https://github.com/Alwatr/store/compare/v5.1.0...v6.0.0-alpha.0) (2024-01-15)

### ⚠ BREAKING CHANGES

* **types:** `PerDevice` and `PerToken` in Region removed

### Code Refactoring

* **types:** replace `PerDevice` and `PerToken` in Region enum with `PerOwner` ([2b47b5d](https://github.com/Alwatr/store/commit/2b47b5dd81e59ee33b17e4ae01253ea2cde5f9ab)) by @AliMD

### Miscellaneous Chores

* **deps:** update ([8f3edcf](https://github.com/Alwatr/store/commit/8f3edcf8a489927a6c43dfcaa5db88a579ecac80)) by @

## [5.1.0](https://github.com/Alwatr/store/compare/v5.0.0...v5.1.0) (2024-01-13)

### Code Refactoring

* Update storeRegionSecret value in Dockerfile and types file ([a0b13c6](https://github.com/Alwatr/store/commit/a0b13c6ff07599a425fa666437c0ebf167ccf6c8)) by @AliMD

# [5.0.0](https://github.com/Alwatr/store/compare/v5.0.0-beta...v5.0.0) (2024-01-12)

### Code Refactoring

* rename region SuperAdmin to Managers ([7c3ece8](https://github.com/Alwatr/store/commit/7c3ece8a24a88ea12a82966e41ea1ad7362159f4)) by @AliMD

### BREAKING CHANGES

* region `SuperAdmin` renamed to `Managers`

# [5.0.0-beta](https://github.com/Alwatr/store/compare/v4.1.0...v5.0.0-beta) (2023-12-31)

### Bug Fixes

* **types:** StoreFileId interface ([d7b0f61](https://github.com/Alwatr/store/commit/d7b0f61d673e6c70c139454aae03f1472f6f7c31)) by @AliMD

### Features

* **type/storeFileId:** change debounce ([0f459b6](https://github.com/Alwatr/store/commit/0f459b6bf51ef2ab79b35a738f7a58dd67686527)) by @AliMD
* **types:** new package for store share types ([8487d02](https://github.com/Alwatr/store/commit/8487d0255b21ab02eecb0b6216e438fe0d0ca852)) by @AliMD

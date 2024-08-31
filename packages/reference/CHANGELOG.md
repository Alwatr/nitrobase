# Change Log

All notable changes to this project will be documented in this file.
See [Conventional Commits](https://conventionalcommits.org) for commit guidelines.

## [7.0.0-beta.1](https://github.com/Alwatr/store/compare/v7.0.0-beta.0...v7.0.0-beta.1) (2024-08-31)

### Code Refactoring

* move schemaVer to storeId ([322b76d](https://github.com/Alwatr/store/commit/322b76d8432752f979e1d4fc3c2250e22945fd36)) by @

## [7.0.0-beta.0](https://github.com/Alwatr/store/compare/v6.2.1...v7.0.0-beta.0) (2024-08-31)

### ⚠ BREAKING CHANGES

* The `update` method in the `DocumentReference` not available anymore. use `updatePartial` instead.

Co-authored-by: Mohammad Honarvar <honarvar.info@gmail.com>
* **DocumentReference:** The `set` method in the `DocumentReference` not available anymore. use `update` instead.

Co-authored-by: Mohammad Honarvar <honarvar.info@gmail.com>
* **DocumentReference:** The `meta` method in the `DocumentReference` not available anymore. use `getStoreMetadata` instead.

Co-authored-by: Mohammad Honarvar <honarvar.info@gmail.com>
* **DocumentReference:** The `get` method in the `DocumentReference` not available anymore. use `getData` instead.

Co-authored-by: Mohammad Honarvar <honarvar.info@gmail.com>
* **CollectionReference:** The `updateMeta_` method in the `CollectionReference` not available anymore. use `updateMetadata_` instead.

Co-authored-by: Mohammad Honarvar <honarvar.info@gmail.com>
* **CollectionReference:** The `update` method in the `CollectionReference` not available anymore. use `updatePartial` instead.

Co-authored-by: Mohammad Honarvar <honarvar.info@gmail.com>
* **CollectionReference:** The `set` method in the `CollectionReference` not available anymore. use `update` instead.

Co-authored-by: Mohammad Honarvar <honarvar.info@gmail.com>
* The `delete` method in the `CollectionReference` not available anymore. use `remove` instead.

Co-authored-by: Mohammad Honarvar <honarvar.info@gmail.com>
* The `create` method in the `CollectionReference` not available anymore. use `add` instead.

Co-authored-by: Mohammad Honarvar <honarvar.info@gmail.com>
* The `access_` method in the `CollectionReference` not available anymore. use `getItemContext_` instead.

Co-authored-by: Mohammad Honarvar <honarvar.info@gmail.com>
* **CollectionReference:** The `metaItem` method in the `CollectionReference` not available anymore. use `getItemMetadata` instead.

Co-authored-by: Mohammad Honarvar <honarvar.info@gmail.com>
* The `meta` method in the `CollectionReference` not available anymore. use `getStoreMetadata` instead.

Co-authored-by: Mohammad Honarvar <honarvar.info@gmail.com>

### Features

* Rename `meta` method to `getStoreMetadata` in CollectionReference ([44ee78e](https://github.com/Alwatr/store/commit/44ee78eaf50d8529aa6362f6dfa13804081a0f7d)) by @AliMD

### Bug Fixes

* logger method name in CollectionReference and DocumentReference ([f84f288](https://github.com/Alwatr/store/commit/f84f288f906fdc707fdc7f49fd6159c1c270e1ec)) by @AliMD

### Code Refactoring

* **CollectionReference:** Rename `item__` method parameter from `id` to `itemId` ([c0cde18](https://github.com/Alwatr/store/commit/c0cde18b1ac456e29118132ee88c9f115cc44442)) by @AliMD
* **CollectionReference:** Rename `metaItem` method to `getItemMetadata` in CollectionReference ([3c9cfdb](https://github.com/Alwatr/store/commit/3c9cfdb741312aa626538a795f7980a140b12f6e)) by @AliMD
* **CollectionReference:** Rename `set` method to `update` in CollectionReference ([258d739](https://github.com/Alwatr/store/commit/258d739e2f00b4f2f548de6158dcdcbfdf6ddf63)) by @AliMD
* **CollectionReference:** Rename `update` method to `updatePartial` in CollectionReference ([d8a438a](https://github.com/Alwatr/store/commit/d8a438a5b9f5b3d9145ccb74ad980c4f22e40914)) by @AliMD
* **CollectionReference:** Rename `updateMeta_` method to `updateMetadata_` in CollectionReference ([815fd1d](https://github.com/Alwatr/store/commit/815fd1d3a301d60304c58117a64fc20a2ac9ef64)) by @AliMD
* **DocumentReference:** Rename `get` method to `getData` in DocumentReference ([0c3c37e](https://github.com/Alwatr/store/commit/0c3c37eb733a94bce78c532bac6167be312c6a9f)) by @AliMD
* **DocumentReference:** Rename `meta` method to `getStoreMetadata` in DocumentReference ([3bed92f](https://github.com/Alwatr/store/commit/3bed92f482444d048edfb369355a61f115a78b09)) by @AliMD
* **DocumentReference:** Rename `set` method to `update` in DocumentReference ([5467a66](https://github.com/Alwatr/store/commit/5467a66daddbd8976953aaac1a900abe67e9c4a3)) by @AliMD
* Rename `access_` method to `getItemContext_` ([76dd262](https://github.com/Alwatr/store/commit/76dd26210e4252ef536f304a43f83007d362af32)) by @AliMD
* Rename `create` method to `add` in CollectionReference ([0a0ee28](https://github.com/Alwatr/store/commit/0a0ee28b200173c615bb8835929e8baa7a0a5463)) by @AliMD
* Rename `delete` method to `remove` in CollectionReference ([017b315](https://github.com/Alwatr/store/commit/017b31591aa69078492f262ccb41b857b937994e)) by @AliMD
* Rename `get` method to `getItem` in CollectionReference ([846ccff](https://github.com/Alwatr/store/commit/846ccff9012e52d930771946b98a7dd93c82977c)) by @AliMD
* Rename `update` method to `updatePartial` in DocumentReference ([c16d164](https://github.com/Alwatr/store/commit/c16d164900954b7d51c516b5f7637e54b1fb8ab7)) by @AliMD
* update parameter name in CollectionReference.exists method ([bb06487](https://github.com/Alwatr/store/commit/bb06487a1fe94d84bf3ff7ba7c44ae5600b1d689)) by @AliMD
* update StoreFileStat type to make extension property optional ([e75a186](https://github.com/Alwatr/store/commit/e75a186fbafd30a3d745467a973bec06e1d8109e)) by @AliMD

### Dependencies update

* update ([2657638](https://github.com/Alwatr/store/commit/26576384c4a8ffcf35776f19008432e194fb39de)) by @AliMD

## [6.2.1](https://github.com/Alwatr/store/compare/v6.2.0...v6.2.1) (2024-08-31)

### Miscellaneous Chores

* **deps-dev:** bump the development-dependencies group across 1 directory with 13 updates ([7e6aa11](https://github.com/Alwatr/store/commit/7e6aa11e1b4507111993a6070b481ebc95e534c7)) by @dependabot[bot]
* **deps:** bump the alwatr-dependencies group with 10 updates ([faf1fc1](https://github.com/Alwatr/store/commit/faf1fc15f8b4c9c4c451dd5fa1d564eb3bf3d9a3)) by @dependabot[bot]
* **deps:** bump the alwatr-dependencies group with 9 updates ([64ac4f2](https://github.com/Alwatr/store/commit/64ac4f239c0f0a8ccdadbd736c16973bd684f811)) by @dependabot[bot]

## [6.2.0](https://github.com/Alwatr/store/compare/v6.1.0...v6.2.0) (2024-07-03)

### Features

* Add freeze property to CollectionReference and DocumentReference ([beeb378](https://github.com/Alwatr/store/commit/beeb37884f5798c3c3b6612dc0626c8cf9c44676)) by @AliMD
* Add saveImmediate method to CollectionReference and DocumentReference ([aa5ab87](https://github.com/Alwatr/store/commit/aa5ab871a5157dd70d55768843aeeab521258a49)) by @AliMD
* **schemaVer:** log schema version changes ([6a5bc90](https://github.com/Alwatr/store/commit/6a5bc9089cd509be141e1d9ee10f2cedc5490925)) by @AliMD

### Bug Fixes

* **schemaVer:** save after change schema version ([99cf345](https://github.com/Alwatr/store/commit/99cf345cfe34edef4f8af2c83157b894f9fb0be0)) by @AliMD

## [6.1.0](https://github.com/Alwatr/store/compare/v6.0.5...v6.1.0) (2024-07-03)

### Features

* schema version ([2590674](https://github.com/Alwatr/store/commit/259067435512b71f1f0aaea07566441cbb85e539)) by @AliMD

### Dependencies update

* bump the development-dependencies ([546ca1b](https://github.com/Alwatr/store/commit/546ca1be049090eb3c8304fcb75e98ac0b984510)) by @AliMD

## [6.0.5](https://github.com/Alwatr/store/compare/v6.0.4...v6.0.5) (2024-05-12)

### Miscellaneous Chores

* **deps-dev:** bump the development-dependencies group across 1 directory with 3 updates ([f97552d](https://github.com/Alwatr/store/commit/f97552d0e8e85bc2e2f0863da17502b8e55799e8)) by @dependabot[bot]
* **deps:** bump the alwatr-dependencies group with 8 updates ([1aa95ca](https://github.com/Alwatr/store/commit/1aa95ca232a7b706eda4b0eb537316d38b27aa28)) by @dependabot[bot]

## [6.0.4](https://github.com/Alwatr/store/compare/v6.0.3...v6.0.4) (2024-04-25)

### Bug Fixes

* **refrence:** set created meta to now ([9cacc0f](https://github.com/Alwatr/store/commit/9cacc0fc84743ccbb5a8a2581963545bb493c2bb)) by @njfamirm

## [6.0.3](https://github.com/Alwatr/store/compare/v6.0.2...v6.0.3) (2024-03-28)

### Miscellaneous Chores

* **deps-dev:** bump the development-dependencies group with 13 updates ([23fb121](https://github.com/Alwatr/store/commit/23fb1217470593d386b658f2a1d85fe4ef6e55df)) by @dependabot[bot]
* **deps:** bump the alwatr-dependencies group with 10 updates ([ce6ee74](https://github.com/Alwatr/store/commit/ce6ee7495aaa67a8d3bb0a3f2b2ea8389e161552)) by @dependabot[bot]
* **deps:** bump the alwatr-dependencies group with 9 updates ([686e155](https://github.com/Alwatr/store/commit/686e155d4c0ccab6daf81d280cf91299152b8583)) by @dependabot[bot]

## [6.0.0](https://github.com/Alwatr/store/compare/v6.0.0-alpha.0...v6.0.0) (2024-01-24)

### Features

- Enhance types, add Jsonifiable type and update method signatures ([57502d2](https://github.com/Alwatr/store/commit/57502d230f0c9cb88aa9a9e71a3460f1219955b0)) by @AliMD

### Miscellaneous Chores

- **deps-dev:** bump the development-dependencies group with 4 updates ([7d71044](https://github.com/Alwatr/store/commit/7d71044165583f9d56fb61a05bdf51ccb104f422)) by @dependabot[bot]
- **deps:** bump the alwatr-dependencies group with 10 updates ([cc42e89](https://github.com/Alwatr/store/commit/cc42e895179c53ee2dd60802d994ba84f5a37fde)) by @dependabot[bot]
- **deps:** update ([0e85743](https://github.com/Alwatr/store/commit/0e85743f76f0efdd0f6cd4001eebc4550b43f43f)) by @AliMD
- **deps:** update ([a894bfc](https://github.com/Alwatr/store/commit/a894bfc62124a3eb027cad4e8d1c974761e22dad)) by @AliMD

## [6.0.0-alpha.0](https://github.com/Alwatr/store/compare/v5.1.0...v6.0.0-alpha.0) (2024-01-15)

### Miscellaneous Chores

- **deps:** update ([8f3edcf](https://github.com/Alwatr/store/commit/8f3edcf8a489927a6c43dfcaa5db88a579ecac80)) by @

## [5.1.0](https://github.com/Alwatr/store/compare/v5.0.0...v5.1.0) (2024-01-13)

**Note:** Version bump only for package @alwatr/store-reference

# [5.0.0](https://github.com/Alwatr/store/compare/v5.0.0-beta...v5.0.0) (2024-01-12)

**Note:** Version bump only for package @alwatr/store-reference

# [5.0.0-beta](https://github.com/Alwatr/store/compare/v4.1.0...v5.0.0-beta) (2023-12-31)

### Bug Fixes

- **reference:** add types to deps ([23788e6](https://github.com/Alwatr/store/commit/23788e6cdcd8f26378896bcf469a1308d49300aa)) by @njfamirm
- **reference:** Refactor update delay logic in updated\_\_ to prevent data lost ([c7282fe](https://github.com/Alwatr/store/commit/c7282fe66685843aad4396461ab8c7060742683a)) by @AliMD

### Features

- **engine:** impediment exit hook ([68695a9](https://github.com/Alwatr/store/commit/68695a975e0ec6c473bbd2d9a62c81720f090352)) by @AliMD
- **reference:** add debugDomain ([83dd29a](https://github.com/Alwatr/store/commit/83dd29ad07e0a80ae1882f0a459402cf671708ef)) by @AliMD
- **reference:** Add hasUnprocessedChanges\_ flag to CollectionReference and DocumentReference ([dff3553](https://github.com/Alwatr/store/commit/dff35530732cce20d21337cb14df9b4ada9022b6)) by @AliMD
- **reference:** add immediate option to save methods ([9267cfd](https://github.com/Alwatr/store/commit/9267cfd13a19ab70cbf2857fe7160314d6a192d8)) by @AliMD
- **reference:** debounce for save file ([b40f9e9](https://github.com/Alwatr/store/commit/b40f9e9d4a2d2501471488b07266576a595380c3)) by @AliMD
- **reference:** enhance logging ([4eab5a2](https://github.com/Alwatr/store/commit/4eab5a277f1bf818fdba2e49ae3ecf0d7e68b4f7)) by @AliMD
- **reference:** Refactor save method to include debounce option and public updateMeta\_ ([d9abf84](https://github.com/Alwatr/store/commit/d9abf8415dbe8e189a6dcba3d837fbe2a0e3cdb0)) by @AliMD

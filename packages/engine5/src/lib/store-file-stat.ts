import {flatString} from '@alwatr/flat-string';

import {StoreFileStat} from '../type';

export class StoreFileStatModel {
  public readonly id: string;
  public readonly path: string;

  constructor(public readonly value: StoreFileStat) {
    let id = value.region + '/' + value.name;
    if (this.value.ownerId !== undefined) {
      id += '/' + value.ownerId;
    }
    this.id = flatString(id);

    let path: string = value.region;
    if (value.ownerId !== undefined) {
      path += '/' + value.ownerId.slice(0, 3) + '/' + value.ownerId;
    }
    path += `/${value.name}.${value.type}.${value.extension}`;
    this.path = flatString(path);
  }
}

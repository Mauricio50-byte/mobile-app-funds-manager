import { TestBed } from '@angular/core/testing';

import { FilePicker } from './file-picker';

describe('FilePicker', () => {
  let service: FilePicker;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(FilePicker);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});

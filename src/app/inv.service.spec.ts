import { TestBed, inject } from '@angular/core/testing';

import { InvService } from './inv.service';

describe('InvService', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [InvService]
    });
  });

  it('should be created', inject([InvService], (service: InvService) => {
    expect(service).toBeTruthy();
  }));
});

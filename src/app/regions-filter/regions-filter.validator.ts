import { Input, Directive } from '@angular/core';
import { NG_VALIDATORS, Validator, Validators, AbstractControl } from '@angular/forms';


@Directive({
  selector: '[regionsFilter][formControlName],[regionsFilter][formControl],[regionsFilter][ngModel]',
  providers: [{provide: NG_VALIDATORS, useExisting: RegionsFilterValidatorDirective, multi: true}],
})
export class RegionsFilterValidatorDirective implements Validator {
  validate(control: AbstractControl): {[key: string]: any} {
    if (!control.value) {
      return null;
    }

    let valid = true;
    for (var line of control.value.split(/\s+/)) {
      var match = line.match(/^(?:chr)?(?:[0-9xX]|[0-1][0-9]|2[0-2]):([0-9]+)(?:\-([0-9]+))?$/i)
      if (match === null) {
        valid = false;
      }
      else if (+match[1] > +match[2]) {
        valid = false;
      }
     }
    return valid ? null : {'regionsFilter': true};
  }
}

import { Component, OnInit, Input } from '@angular/core';
import { UserGroup } from '../users-groups/users-groups';
import { IDropdownSettings } from 'ng-multiselect-dropdown';

@Component({
  selector: 'gpf-user-groups-selector',
  templateUrl: './user-groups-selector.component.html',
  styleUrls: ['./user-groups-selector.component.css']
})
export class UserGroupsSelectorComponent implements OnInit {
  @Input() allInputtedGroups: UserGroup[];
  @Input() defaultGroups: string[] = [];
  @Input() _selectedGroups;

  data: object;
  dropdownSettings: IDropdownSettings = {};

  constructor() { }

  ngOnInit() {
    this.dropdownSettings = {
      idField: 'id',
      textField: 'text',
      allowSearchFilter: true
    };

    this.data = this.groupsToOptions(this.allInputtedGroups);

    if (this.defaultGroups.length !== 0) {
      this._selectedGroups = this.filterOutDefaultGroups(this._selectedGroups);
    }
  }

  groupsToOptions(groups: UserGroup[]) {
    if (!groups) {
      return null;
    }
    return groups.map(group => {
      return {
        id: group.name,
        text: group.name
      };
    });
  }

  filterOutDefaultGroups(groups: string[]) {
    return groups.filter(group =>
      this.defaultGroups.indexOf(group) === -1);
  }

  // Returns the .text values of the selectedGroups object
  get selectedGroups() {
    const groupsArray = [];

    if (!this._selectedGroups) {
      return;
    }

    for (const group of this._selectedGroups) {
      groupsArray.push(group.text);
    }

    return groupsArray;
  }
}

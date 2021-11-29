import { AfterViewInit, Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { AutismGeneProfilesService } from 'app/autism-gene-profiles-block/autism-gene-profiles.service';
import { AgpConfig } from 'app/autism-gene-profiles-table/autism-gene-profile-table';
import { Observable } from 'rxjs';

@Component({
  selector: 'gpf-autism-gene-profile-single-view-wrapper',
  templateUrl: './autism-gene-profile-single-view-wrapper.component.html',
  styleUrls: ['./autism-gene-profile-single-view-wrapper.component.css']
})
export class AutismGeneProfileSingleViewWrapperComponent implements OnInit, AfterViewInit {
  public $autismGeneToolConfig: Observable<AgpConfig>;
  public geneSymbols: string[];

  public constructor(
    private autismGeneProfilesService: AutismGeneProfilesService,
    private route: ActivatedRoute
  ) { }

  public ngOnInit(): void {
    this.$autismGeneToolConfig = this.autismGeneProfilesService.getConfig();
  }

  public ngAfterViewInit(): void {
    this.geneSymbols = this.paramToArray(this.route.snapshot.params.genes);
  }

  paramToArray(param: string): string[] {
    return param.toUpperCase().split('+').filter(e => e !== '');
  }
}

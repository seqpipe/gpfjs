import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable } from 'rxjs';
import { ConfigService } from '../config/config.service';
import { map, tap } from 'rxjs/operators';
import { DatasetNode } from 'app/dataset-node/dataset-node';

@Injectable()
export class DatasetsTreeService {
  private readonly datasetHierarchyUrl = 'datasets/hierarchy';
  private datasetTreeNodes$: BehaviorSubject<object> = new BehaviorSubject<object>(null);

  public constructor(
    private http: HttpClient,
    private config: ConfigService
  ) {
    this.getDatasetHierarchy().subscribe(
      data => {
        tap(() => {
          this.datasetTreeNodes$.next(data);
        });
      }
    );
  }

  public getDatasetHierarchy(onlyChildren = true): Observable<object> {
    const deleteFields = (obj: object): void => {
      if (obj === null || obj === undefined) {
        return;
      }
      Object.keys(obj).forEach((key) => {
        if (key === 'access_rights' || key === 'name') {
          delete obj[key];
        } else if (typeof obj[key] === 'object') {
          deleteFields(obj[key] as object);
        }
      });
    };

    return this.http.get(`${this.config.baseUrl}${this.datasetHierarchyUrl}`).pipe(
      map(data => {
        this.datasetTreeNodes$.next(data);
        if (onlyChildren) {
          deleteFields(data);
        }
        return data;
      })
    );
  }

  public findNodeById(node: DatasetNode, id: string): DatasetNode | undefined {
    if (node.dataset.id === id) {
      return node;
    }
    if (node.children) {
      for (const child of node.children) {
        const foundNode = this.findNodeById(child, id);
        if (foundNode) {
          return foundNode;
        }
      }
    }
    return undefined;
  }

  public findHierarchyNode(node: object, id: string): object | undefined {
    if (node['dataset'] === id) {
      return node;
    }
    if (node['children']) {
      for (const child of node['children']) {
        const foundNode = this.findHierarchyNode(child as object, id);
        if (foundNode) {
          return foundNode;
        }
      }
    }
    return undefined;
  }

  public getDatasetTreeNodes(): object {
    return this.datasetTreeNodes$.getValue();
  }

  public async getUniqueLeafNodes(dataset: string): Promise<Set<string>> {
    const uniqueLeafNodes = new Set<string>();
    const subject = new Set<string>();
    await new Promise<void>(resolve => {
      this.datasetTreeNodes$.subscribe(datasetTreeNodes => {
        if (datasetTreeNodes) {
          for (const node of datasetTreeNodes['data']) {
            const matchingNode = this.findHierarchyNode(node as object, dataset);
            if (matchingNode) {
              this.addAllLeafNodes(matchingNode, uniqueLeafNodes);
            }
          }
          uniqueLeafNodes.forEach(node => subject.add(node));
          resolve();
        }
      });
    });
    return subject;
  }

  private addAllLeafNodes(node: object, leafNodes: Set<string>): void {
    if (!node) {
      return;
    }

    if (node['children'] && (node['children'] as ArrayLike<object>).length > 0) {
      for (const child of node['children']) {
        this.addAllLeafNodes(child as object, leafNodes);
      }
    } else {
      leafNodes.add(node['dataset'] as string);
    }
  }
}

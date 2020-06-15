import { Component, OnInit, Input, OnChanges } from '@angular/core';
import * as d3 from 'd3';
import { Gene } from './gene';

@Component({
  selector: 'gpf-gene-view',
  templateUrl: './gene-view.component.html',
  styleUrls: ['./gene-view.component.css']
})
export class GeneViewComponent implements OnInit, OnChanges {
  @Input() gene: Gene;

  svgElement;
  svgWidth = 1000;
  svgHeight = 150;
  x;
  brush;
  doubleClickTimer;

  constructor(
  ) {}

  ngOnInit() {
    this.svgElement = d3.select('#svg-container')
    .append('svg')
    .attr('width', this.svgWidth)
    .attr('height', this.svgHeight);

    this.x = d3.scaleLinear()
    .domain([0, 0])
    .range([0, this.svgWidth]);
  }

  ngOnChanges() {
    if (this.gene !== undefined) {
      this.setDefaultScale();
      this.drawGene();
    }
  }

  drawGene() {
    this.svgElement.selectAll('*').remove();

    this.drawTranscript(0);
    this.drawTranscript(1);

    this.brush = d3.brushX().extent([[0, 0], [this.svgWidth, this.svgHeight]])
    .on('end', this.brushEndEvent);

    this.svgElement.append('g')
    .attr('class', 'brush')
    .call(this.brush);
  }

  brushEndEvent = () => {
    const extent = d3.event.selection;

    if (!extent) {
      if (!this.doubleClickTimer) {
        this.doubleClickTimer = setTimeout(this.resetTimer, 250);
        return;
      }
      this.setDefaultScale();
    } else {
      this.x.domain([this.x.invert(extent[0]), this.x.invert(extent[1])]);
      this.svgElement.select('.brush').call(this.brush.move, null);
    }
    this.drawGene();
  }

  resetTimer = () => {
    this.doubleClickTimer = null;
  }

  drawTranscript(transcriptId: number) {
    let y = 0;
    let lastEnd = null;

    if (transcriptId === 0) {
      y = 20;
    } else {
      y = 120;
    }

    for (const exon of this.gene.transcripts[transcriptId].exons) {
      if (lastEnd) {
        this.drawIntron(lastEnd, exon.start, y);
      }
      this.drawExon(exon.start, exon.stop, y);

      lastEnd = exon.stop;
    }
  }

  drawExon(xStart: number, xEnd: number, y: number) {
    this.drawRect(xStart, xEnd, y, 10, 'Exon ?/?');
  }

  drawIntron(xStart: number, xEnd: number, y: number) {
    this.drawRect(xStart, xEnd, y + 4, 2, 'Intron ?/?');
  }

  drawRect(xStart: number, xEnd: number, y: number, height: number, svgTitle: string) {
    const width = this.x(xEnd) - this.x(xStart);

    this.svgElement.append('rect')
    .attr('height', height)
    .attr('width', width)
    .attr('x', this.x(xStart))
    .attr('y', y)
    .append('svg:title').text(svgTitle);
  }

  setDefaultScale() {
    const a = this.gene.transcripts[0].exons;
    const b = this.gene.transcripts[1].exons;

    const domainBeginning = Math.min(a[0].start, b[0].start);
    const domainEnding = Math.max(a[a.length - 1].stop, b[b.length - 1].stop);

    this.x.domain([domainBeginning, domainEnding]);
  }
}

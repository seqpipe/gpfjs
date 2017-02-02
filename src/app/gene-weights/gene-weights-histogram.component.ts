import { Input, Component, OnInit, ViewChild, ViewEncapsulation, Output, EventEmitter, SimpleChanges } from '@angular/core';
import { GeneWeights } from './gene-weights';
import * as d3 from 'd3';

interface RangeChangeListener {
  onRangeChange();
}

class RangeSelector implements RangeChangeListener {
  leftLine: VerticalLine;
  rightLine: VerticalLine;
  private text: any;

  constructor(
    private svg: any,
    private scale: d3.ScaleLinear<number, number>,
    private readonly initialLeftLineX: number,
    private readonly initialRightLineX: number,
    private readonly height: number,
    private readonly rangeChangeListener: RangeChangeListener) {
      this.leftLine =  new LeftVerticalLine(scale, initialLeftLineX, initialLeftLineX, initialRightLineX, height, svg, this);
      this.rightLine = new RightVerticalLine(scale, initialRightLineX, initialLeftLineX, initialRightLineX, height, svg, this);

      this.text = this.svg
        .append("text")
        .attr("y", 0)
        .attr("dy", ".35em")
        .attr("text-anchor", "middle")
        .attr("class", "partitions-text")
        .text("hello");

      this.moveShadowedRange();
  }

  moveShadowedRange() {
    this.svg.selectAll("rect")
      .style("fill", (d, index, objects) => { return objects[index].x.baseVal.value < this.leftLine.currentX
                                                  || objects[index].x.baseVal.value > this.rightLine.currentX
                                                  ? "lightsteelblue": "steelblue"})

    this.leftLine.maxLineX = this.rightLine.currentX;
    this.rightLine.minLineX = this.leftLine.currentX;

    let number = this.scale.invert(this.rightLine.currentX - this.leftLine.currentX).toFixed(0);
    let perc =  (((this.rightLine.currentX - this.leftLine.currentX)/(this.initialRightLineX - this.initialLeftLineX)) * 100).toFixed(2);

    this.text
      .attr("x", (this.rightLine.currentX + this.leftLine.currentX) / 2)
      .text(number + "(" + perc + "%)");
  }

  onRangeChange() {
    this.moveShadowedRange();
    this.rangeChangeListener.onRangeChange();
  }

  get currentRange() {
    return [this.scale.invert(this.leftLine.currentX), this.scale.invert(this.rightLine.currentX)];
  }

  set currentRange(range: Array<number>) {
    this.leftLine.currentX = this.scale(range[0]);
    this.rightLine.currentX = this.scale(range[1]);
    this.moveShadowedRange();
  }
}

abstract class VerticalLine {
  protected lineGroup: any;

  public minLineX: number;
  public maxLineX: number;


  constructor(
    protected scale: d3.ScaleLinear<number, number>,
    private lineX,
    protected readonly totalMinLineX: number,
    protected readonly totalMaxLineX: number,
    private readonly height: number,
    private readonly svg: any,
    private readonly rangeChangeListener: RangeChangeListener) {
      this.minLineX = totalMinLineX;
      this.maxLineX = totalMaxLineX;
      this.drawDraggableVerticalLine()
  }

  get currentX() {
    return this.lineX;
  }

  abstract drawText(): void;
  abstract updateText(): void;

  drawDraggableVerticalLine() {
    this.lineGroup = this.svg.append("g")
      .call(d3.drag().on("drag", () => this.onDrag(d3.event.x)))
      .attr("transform", "translate(" + this.lineX + ", 0)")
      .style("cursor", "ew-resize");

    this.drawText();

    let line = this.lineGroup
      .append("line")
      .attr("x1", 0)
      .attr("y1", 0)
      .attr("x2", 0)
      .attr("y2", this.height)
      .attr("stroke", "green")
      .attr("stroke-width", 5)

    this.lineGroup.append("path")
      .attr("transform", "translate(6, 15) rotate(90) scale(0.5)")
      .attr("stroke", "black")
      .attr("fill", "green")
      .attr("d", d3.symbol().type((d3.symbolTriangle)));

    this.lineGroup.append("path")
      .attr("transform", "translate(-6, 15) rotate(-90) scale(0.5)")
      .attr("stroke", "black")
      .attr("fill", "green")
      .attr("d", d3.symbol().type((d3.symbolTriangle)));
  }

  onDrag(dragX) {
    this.currentX = dragX;
    this.rangeChangeListener.onRangeChange();
  }

  set currentX(newX) {
    if (newX != this.lineX) {
      this.lineX = Math.min(Math.max(newX, this.minLineX), this.maxLineX);
      this.lineGroup
        .attr("transform", "translate(" + this.lineX + ", 0)");
      this.updateText();

    }
  }
}

class LeftVerticalLine extends VerticalLine {
  private text: any;

  drawText() {
    this.text = this.lineGroup
      .append("text")
      .attr("x", -10)
      .attr("y", 15)
      .attr("dy", ".35em")
      .attr("class", "partitions-text")
      .attr("text-anchor", "end")
    this.updateText();
  }

  updateText() {
    let number = this.scale.invert(this.currentX - this.totalMinLineX).toFixed(0);
    let perc = ((this.currentX/this.totalMaxLineX) * 100).toFixed(2);
    this.text.text(number + "(" + perc + "%)");
  }
}

class RightVerticalLine extends VerticalLine {
  private text: any;

  drawText() {
    this.text = this.lineGroup
      .append("text")
      .attr("x", 10)
      .attr("y", 15)
      .attr("dy", ".35em")
      .attr("class", "partitions-text")
      .attr("text-anchor", "start")
    this.updateText();
  }

  updateText() {
    let number = this.scale.invert(this.totalMaxLineX - this.currentX).toFixed(0);
    let perc = ((1 - this.currentX/this.totalMaxLineX) * 100).toFixed(2);
    this.text.text(number + "(" + perc + "%)");
  }
}

@Component({
  encapsulation: ViewEncapsulation.None,
  selector: 'gpf-gene-weights-histogram',
  templateUrl: './gene-weights-histogram.component.html',
  styleUrls: ['./gene-weights-histogram.component.css']
})
export class GeneWeightsHistogramComponent implements RangeChangeListener {
  @Output() rangeStartChange = new EventEmitter();
  @Input() rangeStart: number;
  @Output() rangeEndChange = new EventEmitter();
  @Input() rangeEnd: number;

  @Input() width: number;
  @Input() height: number;
  @Input() marginLeft = 100;
  @Input() marginTop = 30;
  @ViewChild('histogramContainer') histogramContainer: any;
  @Input()  geneWeights: GeneWeights;

  private svg: any;
  private rangeSelector: RangeSelector;

  ngOnChanges(changes: SimpleChanges) {
    if ("rangeStart" in changes || "rangeEnd" in changes) {
      if (this.rangeSelector) {
        this.rangeSelector.currentRange = [this.rangeStart, this.rangeEnd];
      }
    }
    if ("geneWeights" in changes) {
      let outerSvg = d3.select(this.histogramContainer.nativeElement).selectAll("svg").remove();
      console.log(this.geneWeights);
      this.redrawHistogram(this.geneWeights);
    }
  }

  onRangeChange() {
    this.rangeStartChange.emit(this.rangeSelector.currentRange[0]);
    this.rangeEndChange.emit(this.rangeSelector.currentRange[1]);
  }

  redrawHistogram(geneWeights: GeneWeights) {
    let barsBinsArray = [];
    for (var i = 0; i < geneWeights.bars.length; i++) {
      barsBinsArray[i] = {
        bin: geneWeights.bins[i],
        bar: geneWeights.bars[i]
      };
    }

    let width = 450;
    let height = 50;
    let barWidth = width / geneWeights.bars.length;
    let outerSvg = d3.select(this.histogramContainer.nativeElement)
      .append("svg")
      .attr("width", this.width)
      .attr("height", this.height)
      .append("g")
      .attr("transform", "translate(" + this.marginLeft + "," + this.marginTop + ")");
    let svg =   outerSvg.append("g")
      .attr("transform", "translate(0, 50)");

    var x = d3.scaleLinear()
      .domain([geneWeights.min, geneWeights.max])
      .rangeRound([0, width]);

    var y = d3.scaleLinear().range([height, 0]);

    y.domain([0, d3.max(geneWeights.bars)]);
    // Add the x Axis
    svg.append("g")
      .attr("transform", "translate(0," + height + ")")
      .call(d3.axisBottom(x));

    let leftAxis = d3.axisLeft(y);
    leftAxis.ticks(5);
    svg.append("g")
        .call(leftAxis);

    svg.selectAll("bar")
      .data(barsBinsArray)
      .enter().append("rect")
      .style("fill", "steelblue")
      .attr("x", function(d: any) { return x(d.bin); })
      .attr("width", barWidth)
      .attr("y", function(d: any) { return y(d.bar); })
      .attr("height", function(d: any) { return height - y(d.bar); });
    this.svg = svg;
    this.rangeSelector = new RangeSelector(outerSvg, x, x(geneWeights.min), x(geneWeights.max), height + 50, this);
  }

}

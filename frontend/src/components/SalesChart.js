import React, { useEffect, useRef } from 'react';
import * as d3 from 'd3';

const SalesChart = ({ predictions }) => {
  const svgRef = useRef();

  useEffect(() => {
    if (!predictions.length) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();

    const margin = { top: 20, right: 30, bottom: 40, left: 50 };
    const width = 600 - margin.left - margin.right;
    const height = 400 - margin.top - margin.bottom;

    const g = svg
      .attr('width', width + margin.left + margin.right)
      .attr('height', height + margin.top + margin.bottom)
      .append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    // Prepare data
    const data = predictions.map((pred, index) => ({
      index: index + 1,
      prediction: pred.prediction,
      product: pred.input.Product
    }));

    // Scales
    const xScale = d3.scaleLinear()
      .domain([1, predictions.length])
      .range([0, width]);

    const yScale = d3.scaleLinear()
      .domain([0, d3.max(data, d => d.prediction) * 1.1])
      .range([height, 0]);

    const colorScale = d3.scaleOrdinal(d3.schemeCategory10);

    // Axes
    g.append('g')
      .attr('transform', `translate(0,${height})`)
      .call(d3.axisBottom(xScale))
      .append('text')
      .attr('x', width / 2)
      .attr('y', 35)
      .attr('fill', 'black')
      .text('Prediction Number');

    g.append('g')
      .call(d3.axisLeft(yScale))
      .append('text')
      .attr('transform', 'rotate(-90)')
      .attr('y', -35)
      .attr('x', -height / 2)
      .attr('fill', 'black')
      .text('Predicted Sales ($)');

    // Line
    const line = d3.line()
      .x(d => xScale(d.index))
      .y(d => yScale(d.prediction))
      .curve(d3.curveMonotoneX);

    g.append('path')
      .datum(data)
      .attr('fill', 'none')
      .attr('stroke', 'steelblue')
      .attr('stroke-width', 2)
      .attr('d', line);

    // Dots
    g.selectAll('.dot')
      .data(data)
      .enter()
      .append('circle')
      .attr('class', 'dot')
      .attr('cx', d => xScale(d.index))
      .attr('cy', d => yScale(d.prediction))
      .attr('r', 5)
      .attr('fill', d => colorScale(d.product))
      .append('title')
      .text(d => `Product: ${d.product}\nPredicted: $${d.prediction.toFixed(2)}`);

    // Legend
    const legend = g.selectAll('.legend')
      .data(colorScale.domain())
      .enter()
      .append('g')
      .attr('class', 'legend')
      .attr('transform', (d, i) => `translate(0,${i * 20})`);

    legend.append('rect')
      .attr('x', width - 100)
      .attr('width', 18)
      .attr('height', 18)
      .style('fill', colorScale);

    legend.append('text')
      .attr('x', width - 80)
      .attr('y', 9)
      .attr('dy', '.35em')
      .style('text-anchor', 'start')
      .text(d => d);

  }, [predictions]);

  return (
    <div className="sales-chart">
      <h3>Prediction History</h3>
      {predictions.length > 0 ? (
        <svg ref={svgRef}></svg>
      ) : (
        <p>Make predictions to see the chart</p>
      )}
    </div>
  );
};

export default SalesChart;
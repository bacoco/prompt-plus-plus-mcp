import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';

interface OutputComparisonProps {
  originalOutput: string;
  refinedOutput: string;
}

export const OutputComparison: React.FC<OutputComparisonProps> = ({ originalOutput, refinedOutput }) => {
  // Analyze outputs for metrics
  const analyzeOutput = (output: string) => {
    const words = output.split(/\s+/).filter(w => w.length > 0);
    const sentences = output.split(/[.!?]+/).filter(s => s.trim().length > 0);
    const avgWordLength = words.length > 0 ? words.reduce((sum, w) => sum + w.length, 0) / words.length : 0;
    
    return {
      wordCount: words.length,
      sentenceCount: sentences.length,
      avgWordLength: avgWordLength.toFixed(1),
      clarity: Math.min(100, 50 + (sentences.length * 5)), // Mock clarity score
      specificity: Math.min(100, 60 + (words.length / 10)), // Mock specificity
      coherence: Math.min(100, 70 + Math.random() * 20), // Mock coherence
    };
  };

  const originalMetrics = analyzeOutput(originalOutput);
  const refinedMetrics = analyzeOutput(refinedOutput);

  const comparisonData = [
    {
      metric: 'Word Count',
      Original: originalMetrics.wordCount,
      Refined: refinedMetrics.wordCount,
    },
    {
      metric: 'Sentences',
      Original: originalMetrics.sentenceCount,
      Refined: refinedMetrics.sentenceCount,
    },
    {
      metric: 'Avg Word Length',
      Original: parseFloat(originalMetrics.avgWordLength),
      Refined: parseFloat(refinedMetrics.avgWordLength),
    },
  ];

  const radarData = [
    {
      metric: 'Clarity',
      Original: originalMetrics.clarity,
      Refined: refinedMetrics.clarity,
      fullMark: 100,
    },
    {
      metric: 'Specificity',
      Original: originalMetrics.specificity,
      Refined: refinedMetrics.specificity,
      fullMark: 100,
    },
    {
      metric: 'Coherence',
      Original: originalMetrics.coherence,
      Refined: refinedMetrics.coherence,
      fullMark: 100,
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Output Metrics Comparison</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={comparisonData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="metric" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="Original" fill="#8884d8" />
              <Bar dataKey="Refined" fill="#82ca9d" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Quality Analysis</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={250}>
            <RadarChart data={radarData}>
              <PolarGrid />
              <PolarAngleAxis dataKey="metric" />
              <PolarRadiusAxis angle={90} domain={[0, 100]} />
              <Radar name="Original" dataKey="Original" stroke="#8884d8" fill="#8884d8" fillOpacity={0.6} />
              <Radar name="Refined" dataKey="Refined" stroke="#82ca9d" fill="#82ca9d" fillOpacity={0.6} />
              <Legend />
            </RadarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
};
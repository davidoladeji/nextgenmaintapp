import { NextResponse } from 'next/server';

export async function GET() {
  try {
    console.log('Testing chart generation...');

    // Test if canvas loads
    const { ChartJSNodeCanvas } = await import('chartjs-node-canvas');
    console.log('✓ chartjs-node-canvas imported');

    const chartJSNodeCanvas = new ChartJSNodeCanvas({
      width: 400,
      height: 400,
      backgroundColour: 'white',
    });
    console.log('✓ ChartJSNodeCanvas instance created');

    const configuration = {
      type: 'bar',
      data: {
        labels: ['Test 1', 'Test 2'],
        datasets: [{
          label: 'Test Data',
          data: [10, 20],
          backgroundColor: '#3b82f6',
        }],
      },
    };

    console.log('Rendering chart...');
    const buffer = await chartJSNodeCanvas.renderToBuffer(configuration as any);
    console.log('✓ Chart rendered, buffer size:', buffer.length);

    return new NextResponse(buffer, {
      headers: {
        'Content-Type': 'image/png',
      },
    });
  } catch (error) {
    console.error('✗ Chart generation failed:', error);
    return NextResponse.json({
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
    }, { status: 500 });
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { exportToPDF } from '@/lib/export';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { project, failureModes, metrics, chartData, components, exportMetadata } = body;

    console.log('=== PDF EXPORT API CALLED ===');
    console.log('Project:', project?.name);
    console.log('Failure Modes count:', failureModes?.length);
    console.log('Components count:', components?.length);
    console.log('Has ChartData:', !!chartData);
    console.log('ChartData keys:', chartData ? Object.keys(chartData) : 'none');

    // Generate PDF with charts (returns the jsPDF doc)
    console.log('Calling exportToPDF...');
    const doc = await exportToPDF(
      project,
      failureModes,
      metrics,
      chartData,
      components,
      undefined, // chartImages not needed
      exportMetadata
    );
    console.log('✓ exportToPDF completed');

    // Get PDF as buffer
    const pdfBuffer = Buffer.from(doc.output('arraybuffer'));

    // Return PDF file
    return new NextResponse(pdfBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${project.name}_FMEA_Report.pdf"`,
      },
    });
  } catch (error) {
    console.error('PDF generation failed:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

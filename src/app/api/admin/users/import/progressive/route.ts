import { NextRequest } from 'next/server';
import { UserService, ImportProgress } from '@/lib/user-service';
import { UserImportResult } from '@/lib/types';

export async function POST(request: NextRequest) {
  try {
    console.log('[UserImport] Starting progressive import with SSE');
    
    const { validRows, fileName, isReImport = false } = await request.json();
    
    if (!validRows || !Array.isArray(validRows)) {
      return new Response('Invalid data format - validRows array required', { status: 400 });
    }
    
    console.log(`[UserImport] Progressive import for ${fileName}: ${validRows.length} valid rows, re-import: ${isReImport}`);
    
    // Set up Server-Sent Events
    const stream = new ReadableStream({
      start(controller) {
        const encoder = new TextEncoder();
        
        // Helper function to send progress updates
        const sendProgress = (data: any) => {
          const message = `data: ${JSON.stringify(data)}\n\n`;
          controller.enqueue(encoder.encode(message));
        };
        
        // Start the import process with progress callbacks
        UserService.importUsersWithProgressTracking(
          validRows, 
          isReImport,
          (progress: ImportProgress) => {
            sendProgress({
              type: 'progress',
              phase: progress.phase,
              currentAction: progress.currentAction,
              processedRows: progress.processedRows,
              totalRows: progress.totalRows,
              percentage: progress.percentage,
              stats: progress.stats
            });
          }
        ).then((result: UserImportResult) => {
          // Send final result
          sendProgress({
            type: 'complete',
            success: true,
            message: `Import completed: ${result.createdUsers} users created, ${result.updatedUsers} users updated${result.deactivatedUsers ? `, ${result.deactivatedUsers} users deactivated` : ''}`,
            results: {
              validRows: validRows.length,
              createdUsers: result.createdUsers,
              updatedUsers: result.updatedUsers,
              deactivatedUsers: result.deactivatedUsers || 0,
              importErrors: result.errors.length
            },
            importErrors: result.errors
          });
          
          controller.close();
        }).catch((error: Error) => {
          sendProgress({
            type: 'error',
            error: error instanceof Error ? error.message : 'Unknown error during import'
          });
          
          controller.close();
        });
      }
    });
    
    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
      },
    });
    
  } catch (error) {
    console.error('[UserImport] Critical error in progressive import:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Internal server error during import',
        details: error instanceof Error ? error.message : 'Unknown error'
      }),
      { 
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
}
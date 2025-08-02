import {Browser, chromium} from 'playwright';
import {HtmlToPdfRequest} from './types';
import * as fs from 'fs';
import * as path from 'path';

export class PdfGenerator {
    private browser: Browser | null = null;
    private isInitialized = false;

    async initialize(): Promise<void> {
        if (this.isInitialized && this.browser) {
            return;
        }

        const baseArgs = [
            '--headless=new',
            '--disable-gpu',
            '--no-sandbox',
            '--disable-dev-shm-usage',
            '--disable-background-timer-throttling',
            '--disable-backgrounding-occluded-windows',
            '--disable-renderer-backgrounding',
            '--disable-features=TranslateUI',
            '--disable-ipc-flooding-protection'
        ];

        const arch = process.arch;
        const platform = process.platform;

        console.log(`Running on ${platform}/${arch}`);

        // ARM64-specific optimizations
        if (arch === 'arm64') {
            baseArgs.push(
                '--memory-pressure-off',
                '--max_old_space_size=1024',
                '--single-process'
            );
        }

        // Find browser executable
        let executablePath: string | undefined;
        
        if (process.env.PLAYWRIGHT_BROWSERS_PATH) {
            const browsersPath = process.env.PLAYWRIGHT_BROWSERS_PATH;
            console.log(`Looking for browser in: ${browsersPath}`);
            
            try {
                // List contents of browsers path for debugging
                const contents = fs.readdirSync(browsersPath);
                console.log(`Browser path contents: ${contents.join(', ')}`);
                
                // Look for chromium directories
                const chromiumDirs = contents.filter(dir => dir.startsWith('chromium'));
                console.log(`Found chromium directories: ${chromiumDirs.join(', ')}`);
                
                for (const dir of chromiumDirs) {
                    const possiblePaths = [
                        path.join(browsersPath, dir, 'chrome-linux', 'headless_shell'),
                        path.join(browsersPath, dir, 'chrome-linux', 'chrome'),
                        path.join(browsersPath, dir, 'chrome-linux', 'chromium')
                    ];
                    
                    for (const possiblePath of possiblePaths) {
                        if (fs.existsSync(possiblePath)) {
                            executablePath = possiblePath;
                            console.log(`Found browser executable at: ${executablePath}`);
                            break;
                        }
                    }
                    
                    if (executablePath) break;
                }
            } catch (error) {
                console.error('Error finding browser executable:', error);
            }
        }

        this.browser = await chromium.launch({
            args: baseArgs,
            headless: true,
            executablePath,
        });
        
        this.isInitialized = true;
    }

    async generatePdf(request: HtmlToPdfRequest): Promise<Buffer> {
        console.log('Generating PDF with request:', request);
        if (!this.browser || !this.isInitialized) {
            console.log('Browser not initialized, initializing now...');
            await this.initialize();
        }

        let page = null;
        try {
            page = await this.browser!.newPage();
            
            await page.setContent(request.body, {
                waitUntil: 'networkidle'
            });

            const pdfBuffer = await page.pdf({
                format: 'A4',
                printBackground: true,
                preferCSSPageSize: false
            });

            return pdfBuffer;
        } catch (error) {
            console.error('Error generating PDF:', error);
            
            // If the browser is closed, reinitialize
            if (error instanceof Error && error.message.includes('Target page, context or browser has been closed')) {
                await this.cleanup();
                await this.initialize();
                
                // Retry once
                page = await this.browser!.newPage();
                await page.setContent(request.body, {
                    waitUntil: 'networkidle'
                });
                
                const pdfBuffer = await page.pdf({
                    format: 'A4',
                    printBackground: true,
                    preferCSSPageSize: false
                });
                
                return pdfBuffer;
            }
            
            throw error;
        } finally {
            if (page) {
                try {
                    await page.close();
                } catch (error) {
                    console.error('Error closing page:', error instanceof Error ? error.message : 'Unknown error');
                }
            }
        }
    }

    async cleanup(): Promise<void> {
        if (this.browser) {
            try {
                await this.browser.close();
            } catch (error) {
                console.error('Error closing browser:', error instanceof Error ? error.message : 'Unknown error');
            }
            this.browser = null;
        }
        this.isInitialized = false;
    }
}
/**
 * PDF Export - Captures screenshot and creates summary PDF
 */

export class PDFExporter {
    constructor(options = {}) {
        this.workspaceName = options.workspaceName || 'Simvex Workspace';
        this.getViewportElement = options.getViewportElement || (() => document.body);
        this.getStateData = options.getStateData || (() => ({}));
        this.getSummaryPrompt = options.getSummaryPrompt || (state => `Summary: ${JSON.stringify(state)}`);

        // Check dependencies
        this.jspdf = window.jspdf ? window.jspdf.jsPDF : null;
        this.html2canvas = window.html2canvas;

        if (!this.jspdf || !this.html2canvas) {
            console.warn('PDF Exporter: jsPDF or html2canvas not found. Loading from CDN...');
            this.loadDependencies();
        }
    }

    async loadDependencies() {
        if (!window.html2canvas) {
            await this.loadScript('https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js');
            this.html2canvas = window.html2canvas;
        }
        if (!window.jspdf) {
            await this.loadScript('https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js');
            this.jspdf = window.jspdf.jsPDF;
        }
    }

    loadScript(src) {
        return new Promise((resolve, reject) => {
            const script = document.createElement('script');
            script.src = src;
            script.onload = resolve;
            script.onerror = reject;
            document.head.appendChild(script);
        });
    }

    async generatePDF() {
        // Ensure dependencies are loaded
        if (!this.jspdf || !this.html2canvas) {
            await this.loadDependencies();
        }

        try {
            console.log('Generating PDF...');
            const viewport = this.getViewportElement();

            // Capture screenshot
            const canvas = await this.html2canvas(viewport, {
                useCORS: true,
                logging: false,
                allowTaint: true,
                backgroundColor: '#000000'
            });

            const imgData = canvas.toDataURL('image/jpeg', 0.9);

            // Initialize PDF (A4 size)
            const pdf = new this.jspdf({
                orientation: 'landscape',
                unit: 'mm',
                format: 'a4'
            });

            const pageWidth = pdf.internal.pageSize.getWidth();
            const pageHeight = pdf.internal.pageSize.getHeight();

            // Add Title
            pdf.setFontSize(24);
            pdf.setTextColor(40, 40, 40);
            pdf.text(this.workspaceName, 10, 15);

            // Add Date
            pdf.setFontSize(10);
            pdf.setTextColor(100, 100, 100);
            const dateStr = new Date().toLocaleString();
            pdf.text(`Generated on: ${dateStr}`, pageWidth - 10, 15, { align: 'right' });

            // Add Screenshot (Maintain aspect ratio)
            const imgWidth = pageWidth - 20;
            const imgHeight = (canvas.height * imgWidth) / canvas.width;

            // Check if image fits on page, otherwise scale down
            let finalWidth = imgWidth;
            let finalHeight = imgHeight;
            const maxHeight = pageHeight - 30;

            if (finalHeight > maxHeight) {
                finalHeight = maxHeight;
                finalWidth = (canvas.width * finalHeight) / canvas.height;
            }

            pdf.addImage(imgData, 'JPEG', 10, 25, finalWidth, finalHeight);

            // Add Summary Page if prompt provided (Optional: This could be AI generated text passed in)
            const state = this.getStateData();

            // Add metadata page
            pdf.addPage();
            pdf.setPage(2);

            pdf.setFontSize(18);
            pdf.setTextColor(0, 0, 0);
            pdf.text('Project Metadata', 10, 20);

            pdf.setFontSize(12);
            let yPos = 40;

            // Basic state dump for now
            for (const [key, value] of Object.entries(state)) {
                if (typeof value !== 'object' && yPos < pageHeight - 20) {
                    pdf.text(`${key}: ${value}`, 10, yPos);
                    yPos += 10;
                }
            }

            // Save PDF
            const filename = `simvex-${this.workspaceName.toLowerCase()}-${Date.now()}.pdf`;
            pdf.save(filename);
            console.log('PDF saved:', filename);

            return true;
        } catch (error) {
            console.error('PDF Generation Failed:', error);
            return false;
        }
    }
}

export function createPDFExporter(options) {
    return new PDFExporter(options);
}

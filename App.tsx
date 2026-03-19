import React, { useState, useEffect } from 'react';
import { Plus, Save, Package, Users, FileText, ArrowLeft, Download, Loader2, Eraser } from 'lucide-react';
import { InvoiceData, InvoiceItem, Client } from './types';
import { InvoicePaper } from './components/InvoicePaper';
import { LOGO_URL } from './components/Logo'; // Import the unified logo URL
import * as storage from './utils/storage';
import { jsPDF } from 'jspdf';

// Helper to convert image URL to base64 for jsPDF
// Updated to return PNG to handle transparency and SVG rasterization correctly
const getDataUrl = (url: string): Promise<string> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "Anonymous";
    img.src = url;
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(img, 0, 0);
        resolve(canvas.toDataURL('image/png'));
      } else {
        reject('No context');
      }
    };
    img.onerror = (e) => reject(e);
  });
};

// Current Date helper
const getCurrentDate = () => {
  const now = new Date();
  return now.toLocaleDateString('pt-BR');
};

const getCurrentTime = () => {
  const now = new Date();
  return now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
};

// Default empty invoice
const initialInvoice: InvoiceData = {
  id: '',
  date: getCurrentDate(),
  time: getCurrentTime(),
  clientName: '',
  items: [],
  total: 0,
};

// --- EXTRACTED COMPONENTS ---

interface PrintLayoutProps {
  invoice: InvoiceData;
  setView: (view: 'editor' | 'preview') => void;
}

const PrintLayout: React.FC<PrintLayoutProps> = ({ invoice, setView }) => {
  const [isGenerating, setIsGenerating] = useState(false);

  const handleDownloadPDF = async () => {
    try {
      setIsGenerating(true);
      
      // Attempt to load logo image
      let logoBase64: string | null = null;
      try {
        logoBase64 = await getDataUrl(LOGO_URL);
      } catch (err) {
        console.warn("Could not load logo image for PDF, using text fallback.", err);
      }

      const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });

      // --- CONFIGURAÇÕES DE LAYOUT (MILÍMETROS) ---
      const pageWidth = 210;
      const margin = 10;
      const contentWidth = pageWidth - (margin * 2); // 190mm
      const rowHeight = 6.5; // Altura da linha da tabela
      
      // Definição exata das colunas (Soma = 190mm)
      const cols = {
        cod: { w: 15, x: margin },
        unid: { w: 15, x: margin + 15 },
        prod: { w: 95, x: margin + 15 + 15 },
        price: { w: 30, x: margin + 15 + 15 + 95 },
        total: { w: 35, x: margin + 15 + 15 + 95 + 30 }
      };

      // Helper para moeda
      const fmtMoney = (val: number) => val.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

      // --- FUNÇÃO DE DESENHO DA VIA ---
      const drawInvoiceCopy = (startY: number) => {
        let y = startY;

        doc.setDrawColor(0);
        doc.setTextColor(0);

        // 1. CABEÇALHO (LOGO E EMPRESA)
        // Caixa Externa
        const headerHeight = 22;
        doc.setLineWidth(0.4);
        doc.roundedRect(margin, y, contentWidth, headerHeight, 2, 2);

        // Divisória vertical (1/3 para logo)
        const logoWidth = 60;
        doc.line(margin + logoWidth, y, margin + logoWidth, y + headerHeight);

        // Logo Logic
        if (logoBase64) {
          try {
            // Get image properties to calculate correct aspect ratio
            const imgProps = doc.getImageProperties(logoBase64);
            const imgRatio = imgProps.width / imgProps.height;
            
            // Available space in the box with padding
            const pad = 2;
            const maxH = headerHeight - (pad * 2); 
            const maxW = logoWidth - (pad * 2);    
            
            // Calculate dimensions to fit within maxW and maxH while maintaining aspect ratio
            let finalW = maxW;
            let finalH = finalW / imgRatio;

            // If calculated height exceeds max height, scale by height instead
            if (finalH > maxH) {
               finalH = maxH;
               finalW = finalH * imgRatio;
            }

            // Center the image in the allocated area
            const xPos = margin + (logoWidth - finalW) / 2;
            const yPos = y + (headerHeight - finalH) / 2;
            
            doc.addImage(logoBase64, 'PNG', xPos, yPos, finalW, finalH);
          } catch (e) {
             console.error("Error adding image to PDF", e);
             // Fallback
             doc.setFont("helvetica", "bold");
             doc.text("PART", margin + (logoWidth/2), y + 10, { align: "center" });
             doc.text("PHONE", margin + (logoWidth/2), y + 16, { align: "center" });
          }
        } else {
          // Fallback Text Logo
          doc.setFont("helvetica", "bold");
          doc.setFontSize(14);
          doc.text("PART", margin + (logoWidth/2), y + 8, { align: "center" });
          doc.text("PHONE", margin + (logoWidth/2), y + 14, { align: "center" });
          doc.setFontSize(6);
          doc.text("DISTRIBUIDORA", margin + (logoWidth/2), y + 18, { align: "center" });
        }

        // Info Empresa (Lado Direito)
       const infoCenter = margin + logoWidth + ((contentWidth - logoWidth) / 2);
        doc.setFontSize(14);
        doc.text("PART-PHONE", infoCenter, y + 8, { align: "center" });
        doc.setFontSize(10);
        doc.setFont("helvetica", "normal");
        doc.text("Acessórios e Assistência Técnica", infoCenter, y + 13, { align: "center" });
        doc.setFont("helvetica", "bold");
        doc.text("Telefone: (047) 99670-6996", infoCenter, y + 18, { align: "center" });
        doc.setFontSize(8);
        doc.setFont("helvetica", "normal");
        doc.text("Para garantia, remover qualquer resquício de cola", infoCenter, y + 22, { align: "center" });

        y += headerHeight + 2;

        // 2. DADOS DO CLIENTE (Bordas e Linhas)
        const clientBoxHeight = 18;
        doc.roundedRect(margin, y, contentWidth, clientBoxHeight, 2, 2);
        
        doc.setFontSize(10);
        
        // Linha 1: Data e Cliente
        const line1Y = y + 7;
        
        // Data
        doc.setFont("helvetica", "bold");
        doc.text("Data:", margin + 2, line1Y);
        doc.setFont("helvetica", "normal");
        doc.text(invoice.date, margin + 14, line1Y);
        doc.line(margin + 12, line1Y + 1, margin + 45, line1Y + 1); // Linha abaixo da data

        // Cliente
        doc.setFont("helvetica", "bold");
        doc.text("Cliente:", margin + 50, line1Y);
        doc.setFont("helvetica", "normal");
        // Cortar nome se for muito longo
        const clientName = invoice.clientName.substring(0, 55);
        doc.text(clientName, margin + 65, line1Y);
        doc.line(margin + 63, line1Y + 1, margin + contentWidth - 2, line1Y + 1); // Linha abaixo do nome

        // Linha 2: Hora
        const line2Y = y + 14;
        doc.setFont("helvetica", "bold");
        doc.text("Hora:", margin + 2, line2Y);
        doc.setFont("helvetica", "normal");
        doc.text(invoice.time, margin + 14, line2Y);
        doc.line(margin + 12, line2Y + 1, margin + 45, line2Y + 1);

        y += clientBoxHeight + 2;

        // 3. TABELA DE PRODUTOS
        // Cabeçalho da Tabela
        doc.setFillColor(230, 230, 230); // Cinza claro
        doc.rect(margin, y, contentWidth, 6, 'FD'); // Fill and Draw border
        
        doc.setFontSize(8);
        doc.setFont("helvetica", "bold");
        
        // Centralizar textos do cabeçalho nas colunas
        const centerText = (txt: string, colConfig: {x: number, w: number}) => {
          doc.text(txt, colConfig.x + (colConfig.w / 2), y + 4, { align: "center" });
        };

        centerText("CÓD", cols.cod);
        centerText("QTD", cols.unid);
        doc.text("PRODUTO", cols.prod.x + 2, y + 4); // Alinhado a esquerda
        centerText("PREÇO UNIT", cols.price);
        centerText("TOTAL", cols.total);

        // Desenhar linhas verticais do cabeçalho
        const drawVertLines = (currentY: number, height: number) => {
          doc.line(cols.unid.x, currentY, cols.unid.x, currentY + height);
          doc.line(cols.prod.x, currentY, cols.prod.x, currentY + height);
          doc.line(cols.price.x, currentY, cols.price.x, currentY + height);
          doc.line(cols.total.x, currentY, cols.total.x, currentY + height);
        };
        drawVertLines(y, 6);

        y += 6;

        // Linhas da Tabela
        // Reduced to 10 rows to ensure Signature fits in Half-A4
        const rowCount = 10; 
        const tableBodyHeight = rowCount * rowHeight;

        // Desenhar caixa externa do corpo da tabela
        doc.rect(margin, y, contentWidth, tableBodyHeight);
        // Desenhar linhas verticais em toda a altura da tabela
        drawVertLines(y, tableBodyHeight);

        doc.setFont("helvetica", "normal");
        
        for (let i = 0; i < rowCount; i++) {
          const item = invoice.items[i];
          const rowY = y + (i * rowHeight);

          // Linha horizontal inferior da célula
          doc.line(margin, rowY + rowHeight, margin + contentWidth, rowY + rowHeight);

          if (item) {
            // Conteúdo do item
            doc.text(item.code || '', cols.cod.x + (cols.cod.w/2), rowY + 4.5, { align: "center" });
            
            // QTD
            doc.text(item.quantity.toString(), cols.unid.x + (cols.unid.w/2), rowY + 4.5, { align: "center" });
            
            // Truncate product description
            const desc = item.description.length > 55 ? item.description.substring(0, 55) + '...' : item.description;
            doc.text(desc.toUpperCase(), cols.prod.x + 2, rowY + 4.5);
            
            doc.text(fmtMoney(item.price), cols.price.x + cols.price.w - 2, rowY + 4.5, { align: "right" });
            doc.text(fmtMoney(item.total), cols.total.x + cols.total.w - 2, rowY + 4.5, { align: "right" });
          }
        }

        // 1️⃣ OBTER Y FINAL DA TABELA
        const finalY = y + tableBodyHeight;
        
        // 2️⃣ CALCULAR Y DO TOTAL
        // Pequeno espaço após tabela antes do Total
        const totalY = finalY + 2; 

        // 4. TOTAL GERAL (Caixa Fixa)
        const totalBoxHeight = 8;
        const totalBoxWidth = 50; 
        const totalBoxX = margin + contentWidth - totalBoxWidth;

        // Rótulo alinhado à caixa
        doc.setFont("helvetica", "bold");
        doc.setFontSize(11);
        doc.text("TOTAL GERAL:", totalBoxX - 2, totalY + 6, { align: "right" });

        // Caixa do valor
        doc.setLineWidth(0.5);
        doc.rect(totalBoxX, totalY, totalBoxWidth, totalBoxHeight);
        
        // Conteúdo da caixa
        doc.setFontSize(10);
        doc.text("R$", totalBoxX + 2, totalY + 5.5);
        
        doc.setFontSize(12);
        doc.text(fmtMoney(invoice.total), totalBoxX + totalBoxWidth - 2, totalY + 5.5, { align: "right" });

        // 3️⃣ CALCULAR Y DA ASSINATURA (RELATIVO AO TOTAL)
        // A assinatura deve ficar abaixo da caixa do total
        let assinaturaY = totalY + totalBoxHeight + 8; // Espaço de 8mm após o total

        // 4️⃣ VERIFICAR QUEBRA DE PÁGINA / LIMITE
        // Como estamos fazendo layout de 2 vias fixas, apenas clampamos se necessário
        // para não estourar a "meia folha" (aprox 148mm na primeira via)
        // No caso da primeira via, o limite é ~145mm. 
        // Com 10 linhas: TableEnds ~125mm -> TotalEnds ~135mm -> Assinatura ~143mm. Cabe justo.
        
        // 5️⃣ DESENHAR A ASSINATURA CORRETAMENTE
        doc.setFontSize(10);
        doc.setFont("helvetica", "bold");
        doc.text("Ass:", margin, assinaturaY);
        
        doc.setLineWidth(0.3);
        // Linha da assinatura começando logo após "Ass:" e indo até o final
        doc.line(margin + 10, assinaturaY, margin + 110, assinaturaY);
      };

      // --- EXECUÇÃO: GERAR AS DUAS VIAS ---
      
      // Via 1 (Topo)
      drawInvoiceCopy(10);

      // Linha de Corte (Meio exato da A4 = 148.5mm)
      (doc as any).setLineDash([3, 3], 0);
      doc.setLineWidth(0.2);
      doc.line(0, 148.5, 210, 148.5);
      
      doc.setFontSize(8);
      doc.setTextColor(100);
      doc.text("- - - - - RECORTE AQUI - - - - -", 105, 148.5 - 2, { align: "center" });
      
      // Via 2 (Fundo)
      (doc as any).setLineDash([], 0); // Restaurar linha sólida
      drawInvoiceCopy(158.5); // Margem de segurança após o meio

      // Download
      const safeName = invoice.clientName.replace(/[^a-z0-9]/gi, '_').toLowerCase() || 'nota';
      doc.save(`nota_${safeName}_${invoice.date.replace(/\//g, '-')}.pdf`);
      
    } catch (error) {
      console.error("Error generating PDF:", error);
      alert("Erro ao gerar PDF. Tente novamente.");
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="bg-gray-500 min-h-screen p-4 flex flex-col items-center justify-start print:bg-white print:p-0 print:block">
      
      {/* Toolbar (Hidden on print) */}
      <div className="w-full max-w-[210mm] mb-4 flex flex-col sm:flex-row justify-between items-center no-print bg-white p-3 rounded shadow-lg sticky top-4 z-50 gap-3 sm:gap-0">
         <button onClick={() => setView('editor')} className="text-gray-700 font-bold flex items-center gap-2 hover:bg-gray-100 px-3 py-1 rounded w-full sm:w-auto justify-center sm:justify-start">
           <ArrowLeft size={18} /> Voltar e Editar
         </button>
         
         <div className="flex gap-2 w-full sm:w-auto justify-center sm:justify-end">
           
           {/* Export PDF Button */}
           <button 
             onClick={handleDownloadPDF}
             disabled={isGenerating}
             className={`${isGenerating ? 'bg-gray-400' : 'bg-green-600 hover:bg-green-700'} text-white px-4 py-2 rounded font-bold flex items-center gap-2 shadow-sm transition-all`}
             title="Gerar e baixar arquivo PDF Vetorial"
           >
             {isGenerating ? <Loader2 size={18} className="animate-spin" /> : <Download size={18} />}
             {isGenerating ? 'Gerando...' : 'Salvar PDF'}
           </button>
         </div>
      </div>

      {/* The A4 Paper - Screen Preview Only */}
      <div className="print-container bg-white w-[210mm] min-h-[297mm] p-[5mm] mx-auto paper-shadow flex flex-col justify-between print:shadow-none">
        
        {/* Top Copy */}
        <div className="flex-1 flex flex-col justify-start">
           <InvoicePaper data={invoice} />
        </div>

        {/* Separation Line (Dashed) */}
        {/* Adjusted to be print-safe (black border, no vertical margins in print to fit A4) */}
        <div className="w-full border-t-2 border-dashed border-gray-300 print:border-black my-4 print:my-0 relative flex justify-center items-center">
          <span className="bg-white px-2 text-gray-400 print:text-black text-xs tracking-widest uppercase absolute">Recorte aqui</span>
        </div>

        {/* Bottom Copy */}
        <div className="flex-1 flex flex-col justify-end">
           <InvoicePaper data={invoice} />
        </div>

      </div>
    </div>
  );
};

export default function App() {
  const [view, setView] = useState<'editor' | 'preview'>('editor');
  const [invoice, setInvoice] = useState<InvoiceData>(initialInvoice);
  
  // Data State
  const [clients, setClients] = useState<Client[]>([]);

  // Form States
  const [currentItem, setCurrentItem] = useState<Partial<InvoiceItem>>({ quantity: 1, unit: 'UN' });
  const [showClientSuggestions, setShowClientSuggestions] = useState(false);

  // Load Data on Mount
  useEffect(() => {
    setClients(storage.getClients());
  }, []);

  // Calculation Effect
  useEffect(() => {
    const total = invoice.items.reduce((acc, item) => acc + item.total, 0);
    setInvoice(prev => ({ ...prev, total }));
  }, [invoice.items]);

  // Handlers
  const handleAddItem = () => {
    if (!currentItem.description) return;

    const quantity = currentItem.quantity || 1;
    const price = currentItem.price || 0;
    const total = quantity * price;

    const newItem: InvoiceItem = {
      id: Date.now().toString(),
      code: currentItem.code || '',
      unit: currentItem.unit || 'UN',
      description: currentItem.description,
      price: price,
      quantity: quantity,
      total: total,
    };

    setInvoice(prev => ({
      ...prev,
      items: [...prev.items, newItem]
    }));

    // Reset fields ready for next entry
    setCurrentItem({ quantity: 1, code: '', unit: 'UN', description: '', price: 0 });
  };

  const handleRemoveItem = (id: string) => {
    setInvoice(prev => ({
      ...prev,
      items: prev.items.filter(item => item.id !== id)
    }));
  };

  const handleSelectClient = (client: Client) => {
    setInvoice(prev => ({ ...prev, clientName: client.name }));
    setShowClientSuggestions(false);
  };

  const handleSaveClient = () => {
    if (invoice.clientName) {
      const newClient = { id: Date.now().toString(), name: invoice.clientName };
      storage.saveClient(newClient);
      setClients(storage.getClients());
      alert('Cliente salvo!');
    }
  };

  const handleNewInvoice = () => {
    // Immediate reset without confirmation dialog to avoid browser blocking issues
    // Reset Invoice Data
    setInvoice({
      id: '',
      date: getCurrentDate(),
      time: getCurrentTime(),
      clientName: '',
      items: [],
      total: 0,
    });
    
    // Reset Input Forms
    setCurrentItem({ 
      quantity: 1, 
      unit: 'UN', 
      code: '', 
      description: '', 
      price: 0 
    });
    
    setShowClientSuggestions(false);
  };

  // --- MAIN RENDER ---

  if (view === 'preview') {
    return <PrintLayout invoice={invoice} setView={setView} />;
  }
  
  // Default: Editor
  return (
    <div className="max-w-7xl mx-auto p-4 pb-24">
      {/* Header Actions */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <h1 className="text-3xl font-black text-gray-800 tracking-tight">Nova Nota de Entrega</h1>
        <div className="flex gap-2 w-full md:w-auto">
           {/* Button updated to act immediately and renamed to 'Nova Nota' for clarity */}
           <button onClick={handleNewInvoice} className="flex-1 md:flex-none justify-center bg-gray-200 text-gray-800 px-4 py-2 rounded hover:bg-gray-300 font-bold flex items-center gap-2" title="Limpar tudo e iniciar nova nota">
              <Eraser size={18} /> Nova Nota
           </button>
           
           <button onClick={() => setView('preview')} className="flex-1 md:flex-none justify-center bg-orange-600 text-white px-6 py-2 rounded shadow hover:bg-orange-700 font-bold flex items-center gap-2">
              <FileText size={18} /> Visualizar / Salvar PDF
           </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* LEFT COLUMN: INPUTS */}
        <div className="lg:col-span-1 space-y-6">
          
          {/* Client Section */}
          <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-200">
            <div className="flex justify-between items-center mb-3">
              <h3 className="font-bold text-gray-700 flex items-center gap-2"><Users size={18} /> Cliente</h3>
              <button onClick={handleSaveClient} className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded hover:bg-blue-200" title="Salvar cliente para o futuro">
                <Save size={14} />
              </button>
            </div>
            <div className="relative">
              <input
                type="text"
                className="w-full border-2 border-gray-300 rounded-lg p-2 focus:border-orange-500 outline-none transition-colors"
                placeholder="Nome do Cliente"
                value={invoice.clientName}
                onChange={(e) => {
                  setInvoice({...invoice, clientName: e.target.value});
                  setShowClientSuggestions(true);
                }}
                onFocus={() => setShowClientSuggestions(true)}
              />
              {showClientSuggestions && invoice.clientName.length > 0 && (
                 <div className="absolute z-10 w-full bg-white border border-gray-200 shadow-lg rounded-b-lg mt-1 max-h-40 overflow-y-auto">
                   {clients
                     .filter(c => c.name.toLowerCase().includes(invoice.clientName.toLowerCase()))
                     .map(c => (
                       <div 
                         key={c.id} 
                         className="p-2 hover:bg-orange-50 cursor-pointer text-sm"
                         onClick={() => handleSelectClient(c)}
                       >
                         {c.name}
                       </div>
                     ))}
                 </div>
              )}
            </div>
            <div className="flex gap-2 mt-3">
               <div className="w-1/2">
                  <label className="text-xs font-bold text-black">Data</label>
                  <input 
                    type="text" 
                    value={invoice.date} 
                    onChange={e => setInvoice({...invoice, date: e.target.value})}
                    className="w-full border-b border-gray-300 py-1 focus:border-orange-500 outline-none bg-transparent font-medium text-black" 
                  />
               </div>
               <div className="w-1/2">
                  <label className="text-xs font-bold text-black">Hora</label>
                  <input 
                    type="text" 
                    value={invoice.time} 
                    onChange={e => setInvoice({...invoice, time: e.target.value})}
                    className="w-full border-b border-gray-300 py-1 focus:border-orange-500 outline-none bg-transparent font-medium text-black" 
                  />
               </div>
            </div>
          </div>

          {/* Product Entry Section */}
          <div className="bg-white p-5 rounded-xl shadow-sm border border-orange-200 ring-2 ring-orange-50">
             <h3 className="font-bold text-gray-700 mb-3 flex items-center gap-2"><Package size={18} /> Adicionar Item</h3>
             
             {/* Product Manual Entry */}
             <div className="mb-3">
               <label className="text-xs font-bold text-gray-500 block mb-1">Descrição do Produto</label>
               <input 
                  className="w-full border-2 border-gray-300 rounded-lg p-2 focus:border-orange-500 outline-none transition-colors"
                  placeholder="Ex: Capinha Silicone..."
                  value={currentItem.description || ''}
                  onChange={e => setCurrentItem({...currentItem, description: e.target.value})}
               />
             </div>

             <div className="flex gap-3 mb-4">
               <div className="w-1/2">
                  <label className="text-xs font-bold text-gray-500 block mb-1">Cód (Opcional)</label>
                  <input 
                    className="w-full border-2 border-gray-300 p-2 rounded text-center focus:border-orange-500 outline-none transition-colors"
                    value={currentItem.code || ''}
                    onChange={e => setCurrentItem({...currentItem, code: e.target.value})}
                  />
               </div>
               <div className="w-1/2">
                  <label className="text-xs font-bold text-gray-500 block mb-1">Qtd</label>
                  <input 
                    type="number"
                    className="w-full border-2 border-gray-300 bg-white text-gray-900 p-2 rounded text-center font-bold focus:border-orange-500 outline-none transition-colors"
                    value={currentItem.quantity}
                    onChange={e => setCurrentItem({...currentItem, quantity: Number(e.target.value)})}
                  />
               </div>
             </div>

             <div className="mb-4">
                <label className="text-xs font-bold text-gray-500 block mb-1">Preço Unitário</label>
                <div className="relative">
                  <span className="absolute left-3 top-2 text-gray-500">R$</span>
                  <input 
                    type="number"
                    className="w-full border-2 border-gray-300 p-2 pl-8 rounded font-medium focus:border-orange-500 outline-none transition-colors"
                    value={currentItem.price !== undefined ? currentItem.price : ''}
                    onChange={e => setCurrentItem({...currentItem, price: Number(e.target.value)})}
                  />
                </div>
             </div>

             <button 
              onClick={handleAddItem}
              className="w-full bg-black text-white py-3 rounded-lg font-bold hover:bg-gray-800 transition-colors flex justify-center items-center gap-2"
             >
               <Plus size={20} /> INSERIR NA NOTA
             </button>
          </div>
        </div>

        {/* RIGHT COLUMN: PREVIEW LIST (Now using InvoicePaper for instant feedback) */}
        <div className="lg:col-span-2 flex flex-col items-center bg-gray-100 p-4 rounded-xl border border-gray-200">
           <h3 className="text-gray-700 font-bold mb-4 self-start flex items-center gap-2">
             <FileText size={18} /> Visualização da Nota (Tempo Real)
           </h3>
           <p className="text-xs text-gray-500 mb-4 self-start">
             * Passe o mouse sobre um item na nota abaixo para excluí-lo.
           </p>
           
           <div className="w-full overflow-hidden flex justify-center relative pb-[50px]">
              {/* Scale container to fit A4 (approx 800px) into column */}
              <div className="origin-top transform scale-[0.55] sm:scale-[0.70] md:scale-[0.80] lg:scale-[0.6] xl:scale-[0.75] shadow-lg bg-white">
                 <InvoicePaper data={invoice} onRemoveItem={handleRemoveItem} />
              </div>
           </div>
        </div>

      </div>
    </div>
  );
}

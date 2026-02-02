import React from 'react';
import { Trash2 } from 'lucide-react';
import { InvoiceData } from '../types';
import { Logo } from './Logo';

interface InvoicePaperProps {
  data: InvoiceData;
  onRemoveItem?: (id: string) => void;
}

// The visual layout strictly following the image provided
export const InvoicePaper: React.FC<InvoicePaperProps> = ({ data, onRemoveItem }) => {
  // Ensure we display at least 10 rows to match the visual height of the paper (Adjusted from 12 to fit signature in print)
  const displayRows = [...data.items];
  const emptyRowsNeeded = Math.max(0, 10 - displayRows.length);
  for (let i = 0; i < emptyRowsNeeded; i++) {
    displayRows.push({ id: `empty-${i}`, code: '', unit: '', description: '', price: 0, quantity: 0, total: 0 });
  }

  const formatCurrency = (val: number) => {
    // Always return a value, even if 0, to keep alignment
    return val.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  return (
    <div className="w-full max-w-[210mm] bg-white text-black text-sm font-sans mx-auto relative group-paper">
      {/* Header Container */}
      <div className="border-2 border-black rounded-xl overflow-hidden mb-1 flex">
        {/* Left: Logo Area */}
        <div className="w-1/3 border-r-2 border-black p-1 flex items-center justify-center">
          <Logo />
        </div>
        {/* Right: Info Area */}
        <div className="w-2/3 flex flex-col items-center justify-center p-1 text-center bg-white">
          <h1 className="font-bold text-lg tracking-wide uppercase text-black">Part-Phone</h1>
          <p className="font-semibold text-lg text-black">Telefone: (047) 99670-6996</p>
        </div>
      </div>

      {/* Date/Client Container */}
      <div className="border-2 border-black rounded-xl overflow-hidden mb-1 p-1">
        {/* Row 1: Data and Cliente side-by-side with fluid width */}
        <div className="flex w-full mb-1 gap-4">
          
          {/* Data Block - Auto width based on content but consistent */}
          <div className="flex items-end w-[140px] flex-none">
             <span className="font-bold text-lg mr-1 text-black leading-none mb-1">Data:</span>
             <div className="flex-1 border-b border-black text-center text-lg font-medium text-black leading-none pb-0.5">
               {data.date}
             </div>
          </div>

          {/* Client Block - Takes remaining space */}
          <div className="flex items-end flex-1 min-w-0">
             <span className="font-bold text-lg mr-1 text-black leading-none mb-1">Cliente:</span>
             <div className="flex-1 border-b border-black text-left pl-2 text-lg font-medium truncate text-black leading-none pb-0.5">
               {data.clientName}
             </div>
          </div>
        </div>

        {/* Row 2: Hora */}
        <div className="flex w-full">
           <div className="flex items-end w-[140px] flex-none">
             <span className="font-bold text-lg mr-1 text-black leading-none mb-1">Hora:</span>
             <div className="flex-1 border-b border-black text-center text-lg font-medium text-black leading-none pb-0.5">
               {data.time}
             </div>
           </div>
        </div>
      </div>

      {/* Table Container */}
      <div className="border-2 border-black rounded-xl overflow-hidden mb-1">
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-gray-200 border-b-2 border-black">
              <th className="border-r border-black w-[10%] py-1 text-center font-bold text-sm text-black">CÓD</th>
              <th className="border-r border-black w-[10%] py-1 text-center font-bold text-sm text-black">QTD</th>
              <th className="border-r border-black w-[50%] py-1 text-center font-bold text-sm text-black">PRODUTO</th>
              <th className="border-r border-black w-[15%] py-1 text-center font-bold text-sm text-black">PREÇO UNIT</th>
              <th className="w-[15%] py-1 text-center font-bold text-sm text-black">TOTAL</th>
            </tr>
          </thead>
          <tbody>
            {displayRows.map((row, idx) => (
              <tr key={idx} className="border-b border-black h-6 group hover:bg-yellow-50">
                <td className="border-r border-black px-1 text-center font-bold text-xs text-black">{row.code}</td>
                <td className="border-r border-black px-1 text-center font-bold text-xs text-black">
                  {row.quantity > 0 ? row.quantity : ''}
                </td>
                <td className="border-r border-black px-2 text-left font-bold uppercase truncate max-w-[200px] text-xs relative text-black">
                  {row.description}
                </td>
                <td className="border-r border-black px-1 text-right font-bold text-xs text-black">
                  {row.price > 0 ? formatCurrency(row.price) : ''}
                </td>
                <td className="px-1 text-right font-bold text-xs relative text-black">
                  {row.total > 0 ? formatCurrency(row.total) : ''}
                  
                  {/* Delete Button (Only visible on hover and if row has data) */}
                  {onRemoveItem && row.id && !row.id.toString().startsWith('empty') && (
                    <div className="absolute right-0 top-0 h-full w-8 flex items-center justify-center no-print opacity-0 group-hover:opacity-100 cursor-pointer bg-red-100 hover:bg-red-500 hover:text-white transition-all"
                         onClick={() => onRemoveItem(row.id)}
                         title="Remover item">
                      <Trash2 size={12} />
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        
        {/* Total Row aligned to right - STRICT PRINT LAYOUT FIX */}
        <div className="w-full flex justify-end items-center border-t-2 border-black p-1 gap-2 print:flex print:justify-end print:items-center">
           <span className="font-bold text-lg text-black whitespace-nowrap uppercase">TOTAL:</span>
           {/* Fixed height and width box to ensure stability in print. Justify-between keeps R$ anchored left and value right. */}
           <div className="border border-black rounded px-2 h-9 min-w-[10rem] flex items-center justify-between bg-white text-black print:bg-white">
             <span className="font-bold text-lg mr-1">R$</span>
             <span className="font-bold text-lg text-right truncate">
               {formatCurrency(data.total)}
             </span>
           </div>
        </div>
      </div>

      {/* Signature */}
      <div className="mt-2 flex items-end">
        <span className="font-bold text-lg mr-2 text-black">Ass:</span>
        <div className="flex-1 border-b border-black"></div>
      </div>
    </div>
  );
};
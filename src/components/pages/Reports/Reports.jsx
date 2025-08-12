import React, { useState, useEffect } from 'react';
import { useUser } from '../../../auth/useUser';
import expenseService from '../../../services/expenseService';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import styles from './Reports.module.css';

const Reports = () => {
  const { user } = useUser();
  const currencySymbol = user?.preferences?.currencySymbol || '₹';

  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedSections, setExpandedSections] = useState({});
  const [groupedExpenses, setGroupedExpenses] = useState({});

  useEffect(() => {
    loadExpenses();
  }, []);

  const loadExpenses = async () => {
    try {
      const allExpenses = expenseService.getAllExpenses();
      setExpenses(allExpenses);
      groupExpensesByDate(allExpenses);
      setLoading(false);
    } catch (error) {
      console.error('Error loading expenses:', error);
      setLoading(false);
    }
  };

  const groupExpensesByDate = (expenses) => {
    const grouped = {};
    
    expenses.forEach(expense => {
      const date = new Date(expense.date);
      const year = date.getFullYear();
      const month = date.getMonth();
      const monthName = date.toLocaleDateString('en-US', { month: 'long' });
      
      if (!grouped[year]) {
        grouped[year] = {};
      }
      
      if (!grouped[year][month]) {
        grouped[year][month] = {
          name: monthName,
          expenses: [],
          total: 0
        };
      }
      
      grouped[year][month].expenses.push(expense);
      grouped[year][month].total += expense.amount;
    });

    setGroupedExpenses(grouped);
  };

  const toggleSection = (year, month = null) => {
    const key = month !== null ? `${year}-${month}` : year.toString();
    setExpandedSections(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const formatCurrency = (amount) => {
    return `${currencySymbol}${amount.toLocaleString()}`;
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      day: '2-digit',
      month: 'short'
    });
  };

  const downloadPDF = (year, month = null, monthName = null) => {
    try {
      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.width;
      const pageHeight = doc.internal.pageSize.height;
      let currentY = 30;
      
      // Header with background
      doc.setFillColor(40, 167, 69);
      doc.rect(0, 0, pageWidth, 50, 'F');
      
      // Main title
      const title = month !== null 
        ? `${monthName} ${year} Expense Report`
        : `${year} Annual Expense Report`;
      
      doc.setFontSize(24);
      doc.setTextColor(255, 255, 255);
      doc.setFont('helvetica', 'bold');
      doc.text(title, 20, 25);
      
      // Subtitle
      doc.setFontSize(12);
      doc.setFont('helvetica', 'normal');
      doc.text(`Generated on ${new Date().toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      })}`, 20, 40);
      
      currentY = 70;
      
      // Get data for the report
      let reportData = [];
      let totalAmount = 0;
      
      if (month !== null) {
        const monthData = groupedExpenses[year]?.[month];
        if (monthData) {
          reportData = monthData.expenses.sort((a, b) => new Date(b.date) - new Date(a.date));
          totalAmount = monthData.total;
        }
      } else {
        const yearData = groupedExpenses[year];
        if (yearData) {
          Object.values(yearData).forEach(monthData => {
            reportData.push(...monthData.expenses);
            totalAmount += monthData.total;
          });
          reportData.sort((a, b) => new Date(b.date) - new Date(a.date));
        }
      }
      
      // Summary Box
      doc.setFillColor(248, 249, 250);
      doc.rect(15, currentY - 5, pageWidth - 30, 50, 'F');
      doc.setDrawColor(220, 220, 220);
      doc.rect(15, currentY - 5, pageWidth - 30, 50, 'S');
      
      doc.setFontSize(16);
      doc.setTextColor(40, 40, 40);
      doc.setFont('helvetica', 'bold');
      doc.text('Financial Summary', 25, currentY + 8);
      
      doc.setFontSize(14);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(60, 60, 60);
      
      // Two column layout for summary
      const col1X = 25;
      const col2X = pageWidth / 2 + 10;
      
      doc.text('Total Expenses:', col1X, currentY + 22);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(220, 53, 69);
      doc.text(formatCurrency(totalAmount), col1X + 50, currentY + 22);
      
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(60, 60, 60);
      doc.text('Total Transactions:', col2X, currentY + 22);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(40, 167, 69);
      doc.text(reportData.length.toString(), col2X + 55, currentY + 22);
      
      // Average per transaction
      const avgAmount = reportData.length > 0 ? totalAmount / reportData.length : 0;
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(60, 60, 60);
      doc.text('Average per Transaction:', col1X, currentY + 35);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(108, 117, 125);
      doc.text(formatCurrency(avgAmount), col1X + 65, currentY + 35);
      
      currentY += 65;
      
      // Category breakdown
      const categoryTotals = {};
      reportData.forEach(expense => {
        categoryTotals[expense.category] = (categoryTotals[expense.category] || 0) + expense.amount;
      });
      
      const categories = Object.entries(categoryTotals)
        .sort(([,a], [,b]) => b - a);
      
      if (categories.length > 0) {
        // Category Analysis Header
        doc.setFontSize(16);
        doc.setTextColor(40, 40, 40);
        doc.setFont('helvetica', 'bold');
        doc.text('Category Breakdown', 20, currentY);
        currentY += 15;
        
        // Category bars
        const barMaxWidth = pageWidth - 100;
        
        categories.slice(0, 8).forEach(([category, amount], index) => {
          const percentage = ((amount / totalAmount) * 100).toFixed(1);
          const barWidth = (amount / totalAmount) * barMaxWidth;
          
          // Category name and amount
          doc.setFontSize(11);
          doc.setFont('helvetica', 'normal');
          doc.setTextColor(60, 60, 60);
          doc.text(category, 25, currentY + 5);
          
          doc.setFont('helvetica', 'bold');
          doc.setTextColor(40, 40, 40);
          doc.text(`${formatCurrency(amount)} (${percentage}%)`, 25, currentY + 15);
          
          // Progress bar background
          doc.setFillColor(240, 240, 240);
          doc.rect(25, currentY + 18, barMaxWidth, 6, 'F');
          
          // Progress bar fill
          const colors = [
            [40, 167, 69], [0, 123, 255], [255, 193, 7], [220, 53, 69],
            [108, 117, 125], [23, 162, 184], [102, 16, 242], [253, 126, 20]
          ];
          const color = colors[index % colors.length];
          doc.setFillColor(color[0], color[1], color[2]);
          doc.rect(25, currentY + 18, barWidth, 6, 'F');
          
          currentY += 28;
        });
        
        currentY += 10;
      }
      
      // Check if we need a new page for the transactions table
      if (currentY + 80 > pageHeight - 40) {
        doc.addPage();
        currentY = 30;
      }
      
      // Transactions section
      if (reportData.length > 0) {
        doc.setFontSize(16);
        doc.setTextColor(40, 40, 40);
        doc.setFont('helvetica', 'bold');
        
        if (month !== null) {
          // Monthly report - single table
          doc.text('Transaction Details', 20, currentY);
          currentY += 15;
          
          const tableData = reportData.map(expense => [
            new Date(expense.date).toLocaleDateString('en-US', { 
              month: 'short', 
              day: '2-digit',
              year: 'numeric'
            }),
            expense.description,
            expense.category,
            formatCurrency(expense.amount)
          ]);
          
          autoTable(doc, {
            head: [['Date', 'Description', 'Category', 'Amount']],
            body: tableData,
            startY: currentY,
            theme: 'striped',
            headStyles: {
              fillColor: [40, 167, 69],
              textColor: [255, 255, 255],
              fontSize: 11,
              fontStyle: 'bold',
              halign: 'center',
              cellPadding: { top: 8, bottom: 8, left: 5, right: 5 }
            },
            bodyStyles: {
              fontSize: 10,
              textColor: [60, 60, 60],
              cellPadding: { top: 6, bottom: 6, left: 5, right: 5 }
            },
            alternateRowStyles: {
              fillColor: [248, 249, 250]
            },
            columnStyles: {
              0: { cellWidth: 28, halign: 'center', fontStyle: 'normal' },
              1: { cellWidth: 80, halign: 'left', fontStyle: 'normal' },
              2: { cellWidth: 40, halign: 'center', fontSize: 9, textColor: [108, 117, 125] },
              3: { cellWidth: 32, halign: 'right', fontStyle: 'bold', textColor: [220, 53, 69] }
            },
            margin: { left: 20, right: 20, bottom: 40 },
            styles: { lineColor: [220, 220, 220], lineWidth: 0.5 },
            didDrawPage: (data) => {
              addFooter(doc, title);
            }
          });
        } else {
          // Annual report - month-wise tables
          doc.text('Monthly Transaction Breakdown', 20, currentY);
          currentY += 20;
          
          const yearData = groupedExpenses[year];
          const sortedMonths = Object.keys(yearData).sort((a, b) => b - a);
          
          sortedMonths.forEach((monthIndex, index) => {
            const monthData = yearData[monthIndex];
            const monthExpenses = monthData.expenses.sort((a, b) => new Date(b.date) - new Date(a.date));
            
            // Check if we need a new page for this month
            if (currentY + 60 > pageHeight - 60) {
              doc.addPage();
              currentY = 30;
            }
            
            // Month header
            doc.setFontSize(14);
            doc.setFont('helvetica', 'bold');
            doc.setTextColor(40, 167, 69);
            doc.text(`${monthData.name} ${year}`, 20, currentY);
            
            doc.setFontSize(12);
            doc.setFont('helvetica', 'normal');
            doc.setTextColor(108, 117, 125);
            doc.text(`${monthExpenses.length} transactions • ${formatCurrency(monthData.total)}`, 20, currentY + 12);
            
            currentY += 25;
            
            if (monthExpenses.length > 0) {
              const tableData = monthExpenses.map(expense => [
                new Date(expense.date).toLocaleDateString('en-US', { 
                  month: 'short', 
                  day: '2-digit'
                }),
                expense.description,
                expense.category,
                formatCurrency(expense.amount)
              ]);
              
              autoTable(doc, {
                head: [['Date', 'Description', 'Category', 'Amount']],
                body: tableData,
                startY: currentY,
                theme: 'striped',
                headStyles: {
                  fillColor: [40, 167, 69],
                  textColor: [255, 255, 255],
                  fontSize: 10,
                  fontStyle: 'bold',
                  halign: 'center',
                  cellPadding: { top: 6, bottom: 6, left: 4, right: 4 }
                },
                bodyStyles: {
                  fontSize: 9,
                  textColor: [60, 60, 60],
                  cellPadding: { top: 5, bottom: 5, left: 4, right: 4 }
                },
                alternateRowStyles: {
                  fillColor: [248, 249, 250]
                },
                columnStyles: {
                  0: { cellWidth: 25, halign: 'center', fontStyle: 'normal' },
                  1: { cellWidth: 85, halign: 'left', fontStyle: 'normal' },
                  2: { cellWidth: 35, halign: 'center', fontSize: 8, textColor: [108, 117, 125] },
                  3: { cellWidth: 30, halign: 'right', fontStyle: 'bold', textColor: [220, 53, 69] }
                },
                margin: { left: 20, right: 20, bottom: 50 },
                styles: { lineColor: [220, 220, 220], lineWidth: 0.5 },
                didDrawPage: (data) => {
                  addFooter(doc, title);
                }
              });
              
              currentY = doc.lastAutoTable.finalY + 20;
            } else {
              currentY += 10;
            }
          });
        }
      } else {
        // No data message
        doc.setFillColor(248, 249, 250);
        doc.rect(20, currentY, pageWidth - 40, 40, 'F');
        doc.setDrawColor(220, 220, 220);
        doc.rect(20, currentY, pageWidth - 40, 40, 'S');
        
        doc.setFontSize(14);
        doc.setTextColor(108, 117, 125);
        doc.setFont('helvetica', 'normal');
        doc.text('No transactions found for this period.', pageWidth / 2, currentY + 25, { align: 'center' });
      }
      
      // Save the PDF
      const filename = month !== null 
        ? `${monthName}_${year}_Expense_Report.pdf`
        : `${year}_Annual_Expense_Report.pdf`;
      
      doc.save(filename);
      
    } catch (error) {
      console.error('Error generating PDF:', error);
      alert(`Failed to generate PDF: ${error.message}`);
    }
  };

  // Helper function to add footer
  const addFooter = (doc, title) => {
    const pageHeight = doc.internal.pageSize.height;
    const pageWidth = doc.internal.pageSize.width;
    const pageCount = doc.internal.getNumberOfPages();
    const pageNumber = doc.internal.getCurrentPageInfo().pageNumber;
    
    // Footer line
    doc.setDrawColor(220, 220, 220);
    doc.line(20, pageHeight - 25, pageWidth - 20, pageHeight - 25);
    
    // Page number
    doc.setFontSize(10);
    doc.setTextColor(108, 117, 125);
    doc.setFont('helvetica', 'normal');
    doc.text(
      `Page ${pageNumber} of ${pageCount}`,
      pageWidth - 40,
      pageHeight - 15,
      { align: 'right' }
    );
    
    // Report info
    doc.text(
      `${title} • Generated ${new Date().toLocaleDateString()}`,
      20,
      pageHeight - 15
    );
  };

  const getCategoryIcon = (category) => {
    const icons = {
      'Food & Dining': '🍽️',
      'Transportation': '🚗',
      'Shopping': '🛍️',
      'Entertainment': '🎬',
      'Bills & Utilities': '💡',
      'Healthcare': '🏥',
      'Education': '📚',
      'Travel': '✈️',
      'Other': '💼'
    };
    return icons[category] || '💰';
  };

  if (loading) {
    return (
      <div className={styles.reportsPage}>
        <div className={styles.loading}>Loading reports...</div>
      </div>
    );
  }

  const sortedYears = Object.keys(groupedExpenses).sort((a, b) => b - a);

  return (
    <div className={styles.reportsPage}>
      <div className={styles.pageHeader}>
        <h2>Expense Reports</h2>
        <p>Monthly transaction details with exportable reports</p>
      </div>

      {sortedYears.length === 0 ? (
        <div className={styles.emptyState}>
          <div className={styles.emptyIcon}>📊</div>
          <h3>No Expense Data</h3>
          <p>Start adding expenses to generate detailed reports</p>
        </div>
      ) : (
        <div className={styles.reportsContent}>
          {sortedYears.map(year => {
            const yearData = groupedExpenses[year];
            const yearTotal = Object.values(yearData).reduce((sum, month) => sum + month.total, 0);
            const isYearExpanded = expandedSections[year];

            return (
              <div key={year} className={styles.yearSection}>
                <div className={styles.yearHeader} onClick={() => toggleSection(year)}>
                  <div className={styles.yearInfo}>
                    <h3 className={styles.yearTitle}>{year}</h3>
                    <span className={styles.yearTotal}>{formatCurrency(yearTotal)}</span>
                  </div>
                  <div className={styles.expandControls}>
                    <button
                      className={styles.downloadBtn}
                      onClick={(e) => {
                        e.stopPropagation();
                        downloadPDF(year);
                      }}
                      title="Download Year Report"
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                        <polyline points="7,10 12,15 17,10"/>
                        <line x1="12" y1="15" x2="12" y2="3"/>
                      </svg>
                    </button>
                    <button className={styles.expandBtn}>
                      <svg 
                        width="20" 
                        height="20" 
                        viewBox="0 0 24 24" 
                        fill="none" 
                        stroke="currentColor" 
                        strokeWidth="2"
                        className={isYearExpanded ? `${styles.expandBtn} ${styles.rotated}` : styles.expandBtn}
                      >
                        <polyline points="6,9 12,15 18,9"/>
                      </svg>
                    </button>
                  </div>
                </div>

                {isYearExpanded && (
                  <div className={styles.monthsContainer}>
                    {Object.keys(yearData)
                      .sort((a, b) => b - a)
                      .map(monthIndex => {
                        const monthData = yearData[monthIndex];
                        const monthKey = `${year}-${monthIndex}`;
                        const isMonthExpanded = expandedSections[monthKey];

                        return (
                          <div key={monthIndex} className={styles.monthSection}>
                            <div className={styles.monthHeader} onClick={() => toggleSection(year, monthIndex)}>
                              <div className={styles.monthInfo}>
                                <h4 className={styles.monthTitle}>{monthData.name}</h4>
                                <span className={styles.monthTotal}>{formatCurrency(monthData.total)}</span>
                                <span className={styles.expenseCount}>{monthData.expenses.length} transactions</span>
                              </div>
                              <div className={styles.expandControls}>
                                <button
                                  className={styles.downloadBtn}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    downloadPDF(year, monthIndex, monthData.name);
                                  }}
                                  title="Download Month Report"
                                >
                                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                                    <polyline points="7,10 12,15 17,10"/>
                                    <line x1="12" y1="15" x2="12" y2="3"/>
                                  </svg>
                                </button>
                                <button className={styles.expandBtn}>
                                  <svg 
                                    width="18" 
                                    height="18" 
                                    viewBox="0 0 24 24" 
                                    fill="none" 
                                    stroke="currentColor" 
                                    strokeWidth="2"
                                    className={isMonthExpanded ? `${styles.expandBtn} ${styles.rotated}` : styles.expandBtn}
                                  >
                                    <polyline points="6,9 12,15 18,9"/>
                                  </svg>
                                </button>
                              </div>
                            </div>

                            {isMonthExpanded && (
                              <div className={styles.expensesList}>
                                {monthData.expenses
                                  .sort((a, b) => new Date(b.date) - new Date(a.date))
                                  .map(expense => (
                                    <div key={expense.id} className={styles.expenseItem}>
                                      <div className={styles.expenseIcon}>
                                        {getCategoryIcon(expense.category)}
                                      </div>
                                      <div className={styles.expenseDetails}>
                                        <div className={styles.expenseMain}>
                                          <span className={styles.expenseDescription}>{expense.description}</span>
                                          <span className={styles.expenseAmount}>{formatCurrency(expense.amount)}</span>
                                        </div>
                                        <div className={styles.expenseMeta}>
                                          <span className={styles.expenseDate}>{formatDate(expense.date)}</span>
                                          <span className={styles.expenseCategory}>{expense.category}</span>
                                        </div>
                                      </div>
                                    </div>
                                  ))}
                              </div>
                            )}
                          </div>
                        );
                      })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default Reports;

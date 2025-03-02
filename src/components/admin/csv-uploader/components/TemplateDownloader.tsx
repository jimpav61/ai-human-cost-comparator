
export const TemplateDownloader = () => {
  const handleDownloadTemplate = (e: React.MouseEvent) => {
    e.preventDefault();
    const csvContent = "name,email,company_name,phone_number,website,industry,employee_count\nJohn Doe,john@example.com,Example Inc,555-1234,example.com,Technology,25";
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'leads_template.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="text-xs text-gray-500 mt-2">
      <p>Download a <a href="#" className="text-brand-500 hover:underline" onClick={handleDownloadTemplate}>template CSV file</a> to see the required format.</p>
    </div>
  );
};

export function downloadCSV(data: any[], filename = 'applicants_export.csv') {
  if (!data || !data.length) {
    alert("No data available to export.");
    return;
  }
  
  // Define the headers based on applicant data structure
  const headers = ['ID', 'Name', 'Phone', 'Email', 'Status', 'Source', 'Availability', 'Applied Date', 'Coverage Area', 'Vehicle Type'];
  
  const escapeCsv = (str: string) => {
    if (str === null || str === undefined) return '';
    const s = String(str).replace(/"/g, '""');
    return `"${s}"`;
  };

  const rows = data.map(row => {
    let coverageArea = 'Not specified';
    let vehicleType = 'Unknown';
    let daysString = row.availability || '';
    
    if (row.documents) {
      const docs = row.documents.find((d: any) => d.name === 'Onboarding Material');
      if (docs?.esignData) {
        try {
          const parsed = JSON.parse(docs.esignData);
          coverageArea = (parsed.coverageAddress || parsed.coverageArea || 'Not specified') + (parsed.coverageRadius ? ` (${parsed.coverageRadius} mi)` : '');
          vehicleType = parsed.vehicleType || 'Unknown';
          if (parsed.availabilityDays && Array.isArray(parsed.availabilityDays)) {
            daysString = parsed.availabilityDays.map((d: string) => d.charAt(0).toUpperCase() + d.slice(1)).join(', ');
          }
        } catch (e) {}
      }
    }

    return [
      escapeCsv(row.id),
      escapeCsv(row.name),
      escapeCsv(row.phone),
      escapeCsv(row.email),
      escapeCsv(row.status),
      escapeCsv(row.source),
      escapeCsv(daysString),
      escapeCsv(row.appliedDate),
      escapeCsv(coverageArea),
      escapeCsv(vehicleType)
    ].join(',');
  });

  const csvContent = [headers.join(','), ...rows].join('\n');
  
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

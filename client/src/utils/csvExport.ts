export const convertToCSV = (data: any[]) => {
  const headers = ['Sequence', 'Email', 'Subscription Date'];
  const rows = data.map(item => [
    item.seq,
    item.email,
    new Date(item.createdAt).toLocaleDateString()
  ]);

  const csvContent = [
    headers.join(','),
    ...rows.map(row => row.join(','))
  ].join('\n');

  return csvContent;
};
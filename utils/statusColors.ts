export interface StatusColorConfig {
  bg: string;
  text: string;
  dark: {
    bg: string;
    text: string;
  };
}

export function getStatusColor(status: string): StatusColorConfig {
  const colors = {
    pending: {
      bg: '#FFB74D20',
      text: '#F57C00',
      dark: { bg: '#F57C0020', text: '#FFB74D' }
    },
    processing: {
      bg: '#64B5F620',
      text: '#1976D2',
      dark: { bg: '#1976D220', text: '#64B5F6' }
    },
    'on-hold': {
      bg: '#FFD54F20',
      text: '#FFA000',
      dark: { bg: '#FFA00020', text: '#FFD54F' }
    },
    completed: {
      bg: '#81C78420',
      text: '#388E3C',
      dark: { bg: '#388E3C20', text: '#81C784' }
    },
    cancelled: {
      bg: '#E5737320',
      text: '#D32F2F',
      dark: { bg: '#D32F2F20', text: '#E57373' }
    },
    refunded: {
      bg: '#BA68C820',
      text: '#7B1FA2',
      dark: { bg: '#7B1FA220', text: '#BA68C8' }
    },
    failed: {
      bg: '#EF535020',
      text: '#C62828',
      dark: { bg: '#C6282820', text: '#EF5350' }
    }
  } as const;

  return colors[status as keyof typeof colors] || colors.pending;
} 
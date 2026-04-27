import Button from '@mui/material/Button'

type ScanCancelButtonProps = {
  onCancel: () => void
}

export function ScanCancelButton({ onCancel }: ScanCancelButtonProps) {
  return (
    <Button
      variant="outlined"
      onClick={onCancel}
      sx={{
        minWidth: 118,
        px: 3,
        py: 1,
        borderRadius: 2.5,
        borderColor: '#0b5963',
        color: '#0b2f33',
        backgroundColor: 'background.paper',
        boxShadow: '0 2px 8px rgba(0, 120, 140, 0.12)',
        transition: 'all 0.2s ease',
        '&:hover': {
          borderColor: '#084951',
          backgroundColor: 'rgba(0, 188, 212, 0.06)',
          boxShadow: '0 6px 16px rgba(0, 120, 140, 0.22)',
          transform: 'translateY(-1px)',
        },
        '&:active': {
          transform: 'translateY(0)',
        },
      }}
    >
      Cancel
    </Button>
  )
}

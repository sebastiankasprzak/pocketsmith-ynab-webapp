import React from 'react';
import { Box, Link } from '@mui/material';
import { styled } from '@mui/material/styles';

const SkipLink = styled(Link)(({ theme }) => ({
  position: 'absolute',
  top: '-40px',
  left: '6px',
  background: theme.palette.primary.main,
  color: theme.palette.primary.contrastText,
  padding: '8px 16px',
  textDecoration: 'none',
  borderRadius: '0 0 4px 4px',
  fontSize: '14px',
  fontWeight: 500,
  zIndex: 9999,
  transition: 'top 0.2s ease-in-out',
  '&:focus': {
    top: '0',
    outline: `2px solid ${theme.palette.secondary.main}`,
    outlineOffset: '2px',
  },
  '&:hover': {
    backgroundColor: theme.palette.primary.dark,
    textDecoration: 'underline',
  },
}));

interface SkipLinksProps {
  links?: Array<{
    href: string;
    label: string;
  }>;
}

export const SkipLinks: React.FC<SkipLinksProps> = ({ 
  links = [
    { href: '#main-content', label: 'Skip to main content' },
    { href: '#navigation', label: 'Skip to navigation' },
    { href: '#search', label: 'Skip to search' }
  ]
}) => {
  return (
    <Box
      component="nav"
      aria-label="Skip links"
      sx={{ 
        position: 'relative',
        zIndex: 9999
      }}
    >
      {links.map((link) => (
        <SkipLink
          key={link.href}
          href={link.href}
          onClick={(e) => {
            e.preventDefault();
            const target = document.querySelector(link.href);
            if (target) {
              target.scrollIntoView({ behavior: 'smooth' });
              // Focus the target element if it's focusable
              if (target instanceof HTMLElement) {
                target.focus();
              }
            }
          }}
        >
          {link.label}
        </SkipLink>
      ))}
    </Box>
  );
};
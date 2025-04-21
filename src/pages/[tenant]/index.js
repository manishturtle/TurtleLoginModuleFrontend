import { useEffect } from 'react';
import { useRouter } from 'next/router';
import CircularProgress from '@mui/material/CircularProgress';
import Box from '@mui/material/Box';
import Head from 'next/head';

export default function TenantRouter() {
  const router = useRouter();
  const { tenant } = router.query;

  useEffect(() => {
    if (tenant) {
      // Redirect to tenant user login page
      router.replace({
        pathname: '/[tenant]/login',
        query: { tenant }
      }, `/${tenant}/login`);
    }
  }, [tenant, router]);

  return (
    <>
      <Head>
        <title>Redirecting to tenant login...</title>
      </Head>
      <Box 
        display="flex" 
        justifyContent="center" 
        alignItems="center" 
        minHeight="100vh"
      >
        <CircularProgress />
      </Box>
    </>
  );
}

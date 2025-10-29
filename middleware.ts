import { NextResponse, NextRequest } from 'next/server';

export function middleware(req: NextRequest) {
  const authed = req.cookies.get('umlf_authed')?.value === '1';
  const isAdminRoute = req.nextUrl.pathname.startsWith('/admin');
  if (!authed) {
    const url = req.nextUrl.clone();
    url.pathname = '/signin';
    url.searchParams.set('redirect', req.nextUrl.pathname + req.nextUrl.search);
    return NextResponse.redirect(url);
  }

  if (isAdminRoute) {
    const role = req.cookies.get('umlf_role')?.value;
    if (role !== 'admin') {
      const url = req.nextUrl.clone();
      url.pathname = '/';
      return NextResponse.redirect(url);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/post/:path*', '/my-items/:path*', '/admin/:path*'],
};


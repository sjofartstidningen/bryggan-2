import type { LoaderFunction } from '@remix-run/node';
import { Link, useLoaderData } from '@remix-run/react';

import { SignIn } from '~/components/Auth';
import { authenticator } from '~/services/auth.server';

export default function Index() {
  let data = useLoaderData();

  return (
    <div>
      <h1>Welcome to Bryggan</h1>
      {data.profile == null ? <SignIn /> : <Link to="/app">Go to app</Link>}
      <img src="/preview/2018" alt="" />
    </div>
  );
}

export const loader: LoaderFunction = async ({ request }) => {
  let user = await authenticator.isAuthenticated(request);
  return { profile: user?.profile };
};

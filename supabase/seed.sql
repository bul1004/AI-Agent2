-- seed.sql
-- Database seed data for E2E testing
-- INSERT順序: organization → user → account → member → invitation → session
-- (user.lastActiveOrganizationId が organization を参照するため、organization を先に作成)

BEGIN;

-- ========================================
-- ORGANIZATIONS (最初に作成 - userから参照される)
-- ========================================
INSERT INTO "public"."organization" (
    "id",
    "name",
    "slug",
    "logo",
    "metadata",
    "createdAt",
    "updatedAt"
  )
VALUES (
    'R4sLVjlu6WyiCIc4RpaKMJmmctCXmVxW',
    'E2E Test Team',
    'e2e-test-team',
    null,
    null,
    '2025-12-24 11:30:46.922+00',
    '2025-12-24 11:30:46.889625+00'
  );

-- ========================================
-- USERS (organizationの後 - lastActiveOrganizationIdで参照)
-- ========================================
INSERT INTO "public"."user" (
    "id",
    "name",
    "email",
    "emailVerified",
    "image",
    "lastActiveOrganizationId",
    "createdAt",
    "updatedAt"
  )
VALUES (
    'GnLFtXU7syDdB3ltruVcvulQU0vlpxpU',
    'E2E Owner',
    'e2e-owner@example.com',
    'false',
    null,
    'R4sLVjlu6WyiCIc4RpaKMJmmctCXmVxW',
    '2025-12-24 11:30:45.389+00',
    '2025-12-24 11:30:45.389+00'
  ),
  (
    'NT11wlM30Tnhnei7joyopJ1rKRUfgBt3',
    'E2E Admin',
    'e2e-admin@example.com',
    'false',
    null,
    'R4sLVjlu6WyiCIc4RpaKMJmmctCXmVxW',
    '2025-12-24 11:30:48.307+00',
    '2025-12-24 11:30:48.307+00'
  ),
  (
    'TUKuJOSHHdyQeGFSH5Jy4TwbGFJoQMnH',
    'E2E Member',
    'e2e-member@example.com',
    'false',
    null,
    'R4sLVjlu6WyiCIc4RpaKMJmmctCXmVxW',
    '2025-12-24 11:30:54.139+00',
    '2025-12-24 11:30:54.139+00'
  );

-- ========================================
-- ACCOUNTS (userへの参照があるのでuserの後)
-- ========================================
INSERT INTO "public"."account" (
    "id",
    "userId",
    "accountId",
    "providerId",
    "accessToken",
    "refreshToken",
    "accessTokenExpiresAt",
    "refreshTokenExpiresAt",
    "scope",
    "idToken",
    "password",
    "createdAt",
    "updatedAt"
  )
VALUES (
    'Fo7SxBWCrq6d4WCH67bHpYJZGSfwYMuR',
    'GnLFtXU7syDdB3ltruVcvulQU0vlpxpU',
    'GnLFtXU7syDdB3ltruVcvulQU0vlpxpU',
    'credential',
    null,
    null,
    null,
    null,
    null,
    null,
    'c182b10babbffba36d5659093086a0ef:ef01fa49e7749b68e51d26f8df7831be9f63051bad07a27233b896d7092e746a0517fdc9085ac885d727c67d8c9000d9e4e63293dd03f40761edc02f9ba3fcea',
    '2025-12-24 11:30:45.562+00',
    '2025-12-24 11:30:45.562+00'
  ),
  (
    'Ib4sSUtZoPQiz85DiU8e21uo9uymSaFU',
    'TUKuJOSHHdyQeGFSH5Jy4TwbGFJoQMnH',
    'TUKuJOSHHdyQeGFSH5Jy4TwbGFJoQMnH',
    'credential',
    null,
    null,
    null,
    null,
    null,
    null,
    '39e8dcc52931b5d408bd244062bc0c2c:aa538f643620f161b5702dd10eaa23c926027ec968df1f7d16b364755311662a1094fb8e95176cefb31a8c1ee5bb3fe1438863f8dea5eaaaec9478bbb5d041e8',
    '2025-12-24 11:30:54.218+00',
    '2025-12-24 11:30:54.218+00'
  ),
  (
    'R75vvzAwsB6CTq3XeHTjxKtswO7PA3BO',
    'NT11wlM30Tnhnei7joyopJ1rKRUfgBt3',
    'NT11wlM30Tnhnei7joyopJ1rKRUfgBt3',
    'credential',
    null,
    null,
    null,
    null,
    null,
    null,
    'e855a7890896edb26c8bd12b31c9466c:7c95f0f8e0b8c37d13cd1de78be1332f7ce6853b06d2580057e25d86a1087e939f20fcb420b9fad8131ff39f92586ae3bac9e8484176436d55744c5706e1302c',
    '2025-12-24 11:30:48.384+00',
    '2025-12-24 11:30:48.384+00'
  );

-- ========================================
-- MEMBERS (userとorganizationへの参照があるので後)
-- ========================================
INSERT INTO "public"."member" (
    "id",
    "userId",
    "organizationId",
    "role",
    "createdAt",
    "updatedAt"
  )
VALUES (
    'GZrFxvfHxo3CqJSBMVsMohP2ZhHOBuLV',
    'GnLFtXU7syDdB3ltruVcvulQU0vlpxpU',
    'R4sLVjlu6WyiCIc4RpaKMJmmctCXmVxW',
    'owner',
    '2025-12-24 11:30:47.038+00',
    '2025-12-24 11:30:47.005162+00'
  ),
  (
    'MYK4NyFy9cJReV5cAoW9cDu9ZB0lmcca',
    'TUKuJOSHHdyQeGFSH5Jy4TwbGFJoQMnH',
    'R4sLVjlu6WyiCIc4RpaKMJmmctCXmVxW',
    'member',
    '2025-12-24 11:30:57.357+00',
    '2025-12-24 11:30:57.324277+00'
  ),
  (
    'RaQEm0BC9cW9qCZ4c3v3DpzsCFpv0Krw',
    'NT11wlM30Tnhnei7joyopJ1rKRUfgBt3',
    'R4sLVjlu6WyiCIc4RpaKMJmmctCXmVxW',
    'admin',
    '2025-12-24 11:30:53.328+00',
    '2025-12-24 11:30:53.296118+00'
  );

-- ========================================
-- INVITATIONS
-- ========================================
INSERT INTO "public"."invitation" (
    "id",
    "email",
    "inviterId",
    "organizationId",
    "role",
    "status",
    "expiresAt",
    "createdAt",
    "updatedAt"
  )
VALUES (
    'AXQXv1SmW1cu7yHPJzX0fywQyCGGpFpL',
    'e2e-admin@example.com',
    'GnLFtXU7syDdB3ltruVcvulQU0vlpxpU',
    'R4sLVjlu6WyiCIc4RpaKMJmmctCXmVxW',
    'admin',
    'accepted',
    '2025-12-31 11:30:51.541+00',
    '2025-12-24 11:30:51.541+00',
    '2025-12-24 11:30:51.509282+00'
  ),
  (
    'lRxYiyRqDMhD6RHz68qORjEKtXzlUcYy',
    'e2e-member@example.com',
    'GnLFtXU7syDdB3ltruVcvulQU0vlpxpU',
    'R4sLVjlu6WyiCIc4RpaKMJmmctCXmVxW',
    'member',
    'accepted',
    '2025-12-31 11:30:55.95+00',
    '2025-12-24 11:30:55.95+00',
    '2025-12-24 11:30:55.91763+00'
  );

-- ========================================
-- SESSIONS
-- ========================================
INSERT INTO "public"."session" (
    "id",
    "userId",
    "token",
    "expiresAt",
    "ipAddress",
    "userAgent",
    "activeOrganizationId",
    "createdAt",
    "updatedAt"
  )
VALUES (
    '4IsPwK9jiJVMLYAwKnI1ELzbu6eBtTU3',
    'TUKuJOSHHdyQeGFSH5Jy4TwbGFJoQMnH',
    'JwVVTbv59Y82Nx9S7SQU7neOQGimTZv8',
    '2025-12-31 11:30:56.79+00',
    '127.0.0.1',
    'node',
    'R4sLVjlu6WyiCIc4RpaKMJmmctCXmVxW',
    '2025-12-24 11:30:56.79+00',
    '2025-12-24 11:30:57.523+00'
  ),
  (
    'be1gULx7dVmYMvpdGUVf8SCG6glmX07o',
    'NT11wlM30Tnhnei7joyopJ1rKRUfgBt3',
    'HKVhH2VdHPkQJ50bzHzDgktlOkIb781t',
    '2025-12-31 11:30:52.68+00',
    '127.0.0.1',
    'node',
    'R4sLVjlu6WyiCIc4RpaKMJmmctCXmVxW',
    '2025-12-24 11:30:52.68+00',
    '2025-12-24 11:30:53.407+00'
  ),
  (
    'Btnq933PHnUUCEEs0FmOBSosNS3FPeS5',
    'NT11wlM30Tnhnei7joyopJ1rKRUfgBt3',
    'zCVTdegTzYNJw59yWkeIUlhd1PPbPXGm',
    '2025-12-31 11:30:48.462+00',
    '127.0.0.1',
    'node',
    null,
    '2025-12-24 11:30:48.462+00',
    '2025-12-24 11:30:48.462+00'
  ),
  (
    'pr50hT7xYju2iwqKq3263DR0ujiaVFdt',
    'TUKuJOSHHdyQeGFSH5Jy4TwbGFJoQMnH',
    '7AxG4O2eGZ9OrN0hQMc2thEYuPCxbubw',
    '2025-12-31 11:30:54.383+00',
    '127.0.0.1',
    'node',
    null,
    '2025-12-24 11:30:54.383+00',
    '2025-12-24 11:30:54.383+00'
  ),
  (
    'qXa2qn7QfljYRPjaJb282NHHbXmcpvKU',
    'GnLFtXU7syDdB3ltruVcvulQU0vlpxpU',
    'kZZ5S97FdFigS9u0EFuAJIqSYhOsYSkK',
    '2025-12-31 11:30:45.66+00',
    '127.0.0.1',
    'node',
    null,
    '2025-12-24 11:30:45.66+00',
    '2025-12-24 11:30:45.66+00'
  ),
  (
    'sURvgCQC6c7Y6GSQLRW77GCJnn7pqM68',
    'GnLFtXU7syDdB3ltruVcvulQU0vlpxpU',
    'EbLF9AKjCMpQfFoSeQJr6Oj2fndd7nMk',
    '2025-12-31 11:30:46.49+00',
    '127.0.0.1',
    'node',
    'R4sLVjlu6WyiCIc4RpaKMJmmctCXmVxW',
    '2025-12-24 11:30:46.49+00',
    '2025-12-24 11:30:47.637+00'
  );

-- ========================================
-- SUBSCRIPTIONS (E2Eテスト用 - businessプラン契約済み)
-- ========================================
INSERT INTO "public"."subscriptions" (
    "id",
    "organization_id",
    "stripe_customer_id",
    "stripe_subscription_id",
    "plan",
    "status",
    "current_period_start",
    "current_period_end",
    "cancel_at_period_end",
    "created_at",
    "updated_at"
  )
VALUES (
    'seed-sub-R4sLVjlu6WyiCIc4RpaKMJmmctCXmVxW',
    'R4sLVjlu6WyiCIc4RpaKMJmmctCXmVxW',
    'cus_seed_e2e_test',
    'sub_seed_e2e_test',
    'business',
    'active',
    '2025-12-24 00:00:00+00',
    '2026-01-24 00:00:00+00',
    false,
    '2025-12-24 11:30:47.637+00',
    '2025-12-24 11:30:47.637+00'
  );

COMMIT;

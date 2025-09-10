import NextAuth from "next-auth"
import GoogleProvider from "next-auth/providers/google"
import FacebookProvider from "next-auth/providers/facebook"

const handler = NextAuth({
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
    FacebookProvider({
      clientId: process.env.FACEBOOK_CLIENT_ID!,
      clientSecret: process.env.FACEBOOK_CLIENT_SECRET!,
    })
  ],
  callbacks: {
    async signIn({ user, account, profile }) {
      console.log('🔐 Social login attempt:', {
        provider: account?.provider,
        email: user.email,
        name: user.name
      });

      try {
        // Create or find customer in Medusa
        await createOrLinkMedusaCustomer(user, account);
        return true;
      } catch (error) {
        console.error('❌ Error creating Medusa customer:', error);
        return false;
      }
    },
    async jwt({ token, user, account }) {
      // Store additional user info in JWT
      if (user) {
        token.provider = account?.provider;
      }
      return token;
    },
    async session({ session, token }) {
      // Send properties to the client
      session.provider = token.provider as string;
      return session;
    }
  },
  pages: {
    signIn: '/login',
    error: '/login',
  }
})

/**
 * Create or link Medusa customer from social login
 */
async function createOrLinkMedusaCustomer(user: any, account: any) {
  const medusaBackendUrl = process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL;
  
  try {
    // Check if customer already exists
    const existingCustomerResponse = await fetch(`${medusaBackendUrl}/store/customers/me`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'x-publishable-api-key': process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY || '',
      }
    });

    let customer;
    
    if (!existingCustomerResponse.ok) {
      // Customer doesn't exist, create new one
      console.log('👤 Creating new Medusa customer for:', user.email);
      
      const [firstName, ...lastNameParts] = (user.name || '').split(' ');
      const lastName = lastNameParts.join(' ') || '';
      
      const createResponse = await fetch(`${medusaBackendUrl}/store/customers`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-publishable-api-key': process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY || '',
        },
        body: JSON.stringify({
          email: user.email,
          first_name: firstName || 'User',
          last_name: lastName || '',
          phone: '',
          metadata: {
            social_provider: account?.provider,
            social_id: account?.providerAccountId,
            avatar_url: user.image
          }
        })
      });

      if (!createResponse.ok) {
        const errorData = await createResponse.text();
        throw new Error(`Failed to create customer: ${errorData}`);
      }

      customer = await createResponse.json();
      console.log('✅ Medusa customer created:', customer.customer?.id);
    } else {
      // Customer exists, potentially link social account
      customer = await existingCustomerResponse.json();
      console.log('✅ Existing Medusa customer found:', customer.customer?.id);
      
      // TODO: Update customer metadata with social provider info if needed
    }

    return customer;
  } catch (error) {
    console.error('❌ Error in createOrLinkMedusaCustomer:', error);
    throw error;
  }
}

export { handler as GET, handler as POST }
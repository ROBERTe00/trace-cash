import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { WebAuthnService } from '@/lib/webauthn';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Fingerprint, Shield, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

interface MFACredential {
  id: string;
  device_name: string;
  created_at: string;
}

export function MFASetup() {
  const [credentials, setCredentials] = useState<MFACredential[]>([]);
  const [isSupported, setIsSupported] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setIsSupported(WebAuthnService.isSupported());
    loadCredentials();
  }, []);

  const loadCredentials = async () => {
    const { data, error } = await supabase
      .from('mfa_credentials')
      .select('id, device_name, created_at')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Failed to load MFA credentials:', error);
      return;
    }

    setCredentials(data || []);
  };

  const registerDevice = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        toast.error('You must be logged in to register a device');
        return;
      }

      const credential = await WebAuthnService.register(user.id, user.email || 'user');

      if (!credential) {
        toast.error('Failed to register device');
        return;
      }

      const deviceName = `${navigator.userAgent.includes('Windows') ? 'Windows' : 
                          navigator.userAgent.includes('Mac') ? 'Mac' : 
                          navigator.userAgent.includes('Android') ? 'Android' : 
                          navigator.userAgent.includes('iPhone') ? 'iPhone' : 'Unknown'} Device`;

      const { error } = await supabase.from('mfa_credentials').insert({
        user_id: user.id,
        credential_id: credential.id,
        public_key: credential.publicKey,
        counter: credential.counter,
        device_name: deviceName,
      });

      if (error) {
        toast.error('Failed to save credential');
        return;
      }

      toast.success('Device registered successfully!');
      loadCredentials();
    } catch (error) {
      console.error('MFA registration error:', error);
      toast.error('Failed to register device');
    } finally {
      setLoading(false);
    }
  };

  const removeDevice = async (id: string) => {
    const { error } = await supabase
      .from('mfa_credentials')
      .delete()
      .eq('id', id);

    if (error) {
      toast.error('Failed to remove device');
      return;
    }

    toast.success('Device removed successfully');
    loadCredentials();
  };

  if (!isSupported) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Biometric Authentication
          </CardTitle>
          <CardDescription>
            Your browser doesn't support biometric authentication
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="h-5 w-5" />
          Biometric Authentication (MFA)
        </CardTitle>
        <CardDescription>
          Add an extra layer of security with fingerprint or face recognition
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Button
          onClick={registerDevice}
          disabled={loading}
          className="w-full"
        >
          <Fingerprint className="h-4 w-4 mr-2" />
          Register This Device
        </Button>

        {credentials.length > 0 && (
          <div className="space-y-2">
            <h4 className="font-semibold text-sm">Registered Devices</h4>
            {credentials.map(credential => (
              <div
                key={credential.id}
                className="flex items-center justify-between p-3 border rounded-lg"
              >
                <div>
                  <p className="font-medium">{credential.device_name}</p>
                  <p className="text-sm text-muted-foreground">
                    Added {new Date(credential.created_at).toLocaleDateString()}
                  </p>
                </div>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="ghost" size="icon">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Remove Device</AlertDialogTitle>
                      <AlertDialogDescription>
                        Are you sure you want to remove this device? You won't be able to use it for authentication anymore.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction onClick={() => removeDevice(credential.id)}>
                        Remove
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

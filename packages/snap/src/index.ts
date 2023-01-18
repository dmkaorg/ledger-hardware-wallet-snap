import { OnRpcRequestHandler } from '@metamask/snap-types';


/**
 * Handle incoming JSON-RPC requests, sent through `wallet_invokeSnap`.
 *
 * @param args - The request handler args as object.
 * @param args.origin - The origin of the request, e.g., the website that
 * invoked the snap.
 * @param args.request - A validated JSON-RPC request object.
 * @returns `null` if the request succeeded.
 * @throws If the request method is not valid for this snap.
 * @throws If the `snap_confirm` call failed.
 */
export const onRpcRequest: OnRpcRequestHandler = async ({
  origin,
  request,
}) => {
  let persistedState: SnapKeyringState = await snap.request({
    method: 'snap_manageState',
    params: ['get'],
  });

  if (!persistedState) {
    persistedState = await initializeSnapState(snap);
  }

  console.log(navigator);
  console.log(persistedState);
  console.debug('Request', request);

  const snapLedgerKeyring = new SnapLedgerKeyring();
  await snapLedgerKeyring.connect(snap);
  switch (request.method) {
    case 'hello':
      return snap.request({
        method: 'snap_confirm',
        params: [
          {
            prompt: getMessage(origin),
            description:
              'This custom confirmation is just for display purposes.',
            textAreaContent:
              'But you can edit the snap source code to make it do something, if you want to!',
          },
        ],
      });
    case KeyringMethods.GetAccounts:
      return await snapLedgerKeyring.getAccounts(persistedState);
    case KeyringMethods.AddAccount:
      return await snapLedgerKeyring.addAccount(snap, persistedState, request);
    case KeyringMethods.RemoveAccount:
      return await snapLedgerKeyring.removeAccount(
        snap,
        persistedState,
        request,
      );
    case KeyringMethods.SignEIP712Message:
      throw new Error('TODO');
    case KeyringMethods.SignEIP712HashedMessage:
      throw new Error('TODO');
    case KeyringMethods.SignMessage:
      return await snapLedgerKeyring.signMessage(snap, persistedState, request);
    case KeyringMethods.SignTransaction:
      return await snapLedgerKeyring.signTransaction(
        snap,
        persistedState,
        request,
      );
    case KeyringMethods.ListAccounts:
      return await snapLedgerKeyring.listAccounts(persistedState, request);
    // Only called once
    case KeyringMethods.Setup:
      if (persistedState.initialized) {
        throw new Error('Ledger is already setup');
      }
      return snapLedgerKeyring.setup(snap, persistedState, request);
    // For Debug
    case 'getState':
      return persistedState;
    default:
      throw new Error('Method not found.');
  }
};

import { Anchor, Button, Code, Kbd, PasswordInput, Select, Text, TextInput } from '@mantine/core';
import { AxiosResponse } from 'axios';
import { FormEvent, ReactNode, useCallback, useState } from 'react';
import { ErrorAlert } from '../../components/ErrorAlert.tsx';
import { useAsync } from '../../hooks/use-async.ts';
import { AlgorithmSummary } from '../../models.ts';
import { useStore } from '../../store.ts';
import { authenticatedAxios } from '../../utils/axios.ts';
import { formatTimestamp } from '../../utils/format.ts';
import { AlgorithmList } from './AlgorithmList.tsx';
import { HomeCard } from './HomeCard.tsx';

export function LoadFromProsperity(): ReactNode {
  /*
  Generated by https://chriszarate.github.io/bookmarkleter/
  Raw code:
  if (window.location.hostname !== 'prosperity.imc.com') {
    alert('This bookmarklet should only be used on prosperity.imc.com');
  } else {
    const key = Object.keys(window.localStorage).find(key => key.endsWith('.idToken'));
    if (key !== undefined) {
      navigator.clipboard.writeText(window.localStorage.getItem(key));
      alert('Successfully copied ID token to clipboard!');
    } else {
      alert('ID token not found, are you sure you are logged in?');
    }
  }
   */
  const bookmarklet =
    'javascript:void%20function(){if(%22prosperity.imc.com%22!==window.location.hostname)alert(%22This%20bookmarklet%20should%20only%20be%20used%20on%20prosperity.imc.com%22);else{const%20a=Object.keys(window.localStorage).find(a=%3Ea.endsWith(%22.idToken%22));a===void%200%3Falert(%22ID%20token%20not%20found,%20are%20you%20sure%20you%20are%20logged%20in%3F%22):(navigator.clipboard.writeText(window.localStorage.getItem(a)),alert(%22Successfully%20copied%20ID%20token%20to%20clipboard!%22))}}();';

  // React shows an error when using "javascript:" URLs without dangerouslySetInnerHTML
  const bookmarkletHtml = `<a href="${bookmarklet}">IMC Prosperity ID Token Retriever</a>`;

  const idToken = useStore(state => state.idToken);
  const setIdToken = useStore(state => state.setIdToken);

  const round = useStore(state => state.round);
  const setRound = useStore(state => state.setRound);

  const [proxy, setProxy] = useState('https://imc-prosperity-2-visualizer-cors-anywhere.jmerle.dev/');

  const loadAlgorithms = useAsync<AlgorithmSummary[]>(async (): Promise<AlgorithmSummary[]> => {
    let response: AxiosResponse<AlgorithmSummary[]>;
    try {
      response = await authenticatedAxios.get(
        `https://bz97lt8b1e.execute-api.eu-west-1.amazonaws.com/prod/submission/algo/${round}`,
      );
    } catch (err: any) {
      if (err.response?.status === 403) {
        throw new Error('ID token is invalid, please change it.');
      }

      throw err;
    }

    return response.data.sort((a, b) => Date.parse(b.timestamp) - Date.parse(a.timestamp));
  });

  const onSubmit = useCallback(
    (event?: FormEvent<HTMLFormElement>) => {
      event?.preventDefault();

      if (idToken.trim().length > 0) {
        loadAlgorithms.call();
      }
    },
    [loadAlgorithms],
  );

  const now = Date.now();
  const rounds = [
    { value: 'ROUND0', label: 'Tutorial', openFrom: '2024-02-12T09:00:00.000Z' },
    { value: 'ROUND1', label: 'Round 1', openFrom: '2024-04-08T09:00:00.000Z' },
    { value: 'ROUND2', label: 'Round 2', openFrom: '2024-04-11T09:00:00.000Z' },
    { value: 'ROUND3', label: 'Round 3', openFrom: '2024-04-14T09:00:00.000Z' },
    { value: 'ROUND4', label: 'Round 4', openFrom: '2024-04-17T09:00:00.000Z' },
    { value: 'ROUND5', label: 'Round 5', openFrom: '2024-04-20T09:00:00.000Z' },
  ].map(round => {
    const disabled = Date.parse(round.openFrom) > now;
    const label = disabled ? `${round.label} - Available from ${formatTimestamp(round.openFrom)}` : round.label;

    return {
      value: round.value,
      label,
      disabled,
    };
  });

  return (
    <HomeCard title="Load from Prosperity">
      <Text>
        Requires your Prosperity ID token that is stored in the local storage item with the
        <Code>CognitoIdentityServiceProvider.&lt;some id&gt;.&lt;email&gt;.idToken</Code> key on the Prosperity website.
        You can inspect the local storage items of a website by having the website open in the active tab, pressing{' '}
        <Kbd>F12</Kbd> to open the browser&apos;s developer tools, and going to the <i>Application</i> (Chrome) or{' '}
        <i>Storage</i> (Firefox) tab. From there, click on <i>Local Storage</i> in the sidebar and select the website
        that appears underneath the sidebar entry.
      </Text>
      <Text>
        To make extracting the ID token easier, you can drag the following bookmarklet into your browser&apos;s
        bookmarks bar. When you click it on the Prosperity website, the ID token is copied to the clipboard
        automatically.
        <br />
        <span dangerouslySetInnerHTML={{ __html: bookmarkletHtml }} />
      </Text>
      <Text>
        The visualizer remembers the ID token for ease-of-use, but the token is only valid for a limited amount of time
        so you&apos;ll need to update this field often. Your ID token is only used to list your algorithms and to
        download algorithm logs and results. The visualizer communicates directly with the API used by the Prosperity
        website and never sends data to other servers.
      </Text>
      {/* prettier-ignore */}
      <Text>
        By default the &quot;Open in visualizer&quot; button routes the HTTP request to download the algorithm&apos;s logs through a <Anchor href="https://github.com/Rob--W/cors-anywhere" target="_blank" rel="noreferrer">CORS Anywhere</Anchor> instance hosted by the creator of this visualizer.
        This is necessary because the logs need to be downloaded from an AWS S3 endpoint without <Anchor href="https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Access-Control-Allow-Origin" target="_blank" rel="noreferrer">Access-Control-Allow-Origin</Anchor> headers that allow downloads from this visualizer.
        While I promise no log data is persisted server-side, you are free to change the proxy to one hosted by yourself.
      </Text>

      {loadAlgorithms.error && <ErrorAlert error={loadAlgorithms.error} />}

      <form onSubmit={onSubmit}>
        <PasswordInput
          label="ID token"
          placeholder="ID token"
          value={idToken}
          onInput={e => setIdToken((e.target as HTMLInputElement).value)}
        />

        <Select
          label="Round"
          value={round}
          onChange={value => setRound(value!)}
          data={rounds}
          allowDeselect={false}
          mt="xs"
        />

        <TextInput
          label='"Open in visualizer" CORS Anywhere proxy'
          placeholder="Proxy"
          value={proxy}
          onInput={e => setProxy((e.target as HTMLInputElement).value)}
          mt="xs"
        />

        <Button fullWidth type="submit" loading={loadAlgorithms.loading} mt="sm">
          <div>Load algorithms</div>
        </Button>
      </form>

      {loadAlgorithms.success && <AlgorithmList algorithms={loadAlgorithms.result!} proxy={proxy} />}
    </HomeCard>
  );
}

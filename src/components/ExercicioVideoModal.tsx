import React, { useRef, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Modal, ActivityIndicator, Linking } from 'react-native';
import { WebView } from 'react-native-webview';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { extractYoutubeId } from '../lib/youtube';
import { colors, typography, spacing, radii } from '../theme/theme';

type Props = {
  visible: boolean;
  videoUrl: string | null | undefined;
  exercicioNome: string;
  onClose: () => void;
};

// Player de vídeo do exercício embutido no app: o vídeo continua hospedado no YouTube
// (nada é baixado nem guardado no projeto), só é exibido dentro de um overlay,
// sem abrir o YouTube/navegador externo.
export default function ExercicioVideoModal({ visible, videoUrl, exercicioNome, onClose }: Props) {
  const webviewRef = useRef<WebView>(null);
  const [somLigado, setSomLigado] = useState(false);
  const [carregando, setCarregando] = useState(true);

  const videoId = extractYoutubeId(videoUrl);

  function toggleSom() {
    const ligar = !somLigado;
    setSomLigado(ligar);
    const func = ligar ? 'unMute' : 'mute';
    // O player do YouTube roda num iframe de outra origem (youtube.com), então não dá
    // pra mexer direto no <video> dele — precisa mandar um comando via postMessage
    // seguindo o protocolo da YouTube IFrame API.
    const js = `
      (function(){
        var iframe = document.getElementById('ytplayer');
        if (iframe && iframe.contentWindow) {
          iframe.contentWindow.postMessage(JSON.stringify({ event: 'command', func: '${func}', args: [] }), '*');
        }
      })(); true;
    `;
    webviewRef.current?.injectJavaScript(js);
  }

  function handleClose() {
    setSomLigado(false);
    setCarregando(true);
    onClose();
  }

  if (!visible) return null;

  const embedUrl = videoId
    ? `https://www.youtube.com/embed/${videoId}?autoplay=1&mute=1&playsinline=1&controls=0&modestbranding=1&rel=0&iv_load_policy=3&fs=0&disablekb=1&loop=1&playlist=${videoId}&enablejsapi=1`
    : null;

  // O YouTube recusa (erro 153) quando o embed é carregado direto como página principal
  // do WebView. Ele espera rodar dentro de um <iframe> de uma página "pai" — por isso
  // montamos um HTML mínimo local com o iframe apontando pro embed.
  const playerHtml = embedUrl
    ? `
      <!DOCTYPE html>
      <html>
        <head>
          <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no" />
          <style>
            html, body { margin: 0; padding: 0; background: #000; height: 100%; overflow: hidden; }
            iframe { position: absolute; top: 0; left: 0; width: 100%; height: 100%; border: 0; }
          </style>
        </head>
        <body>
          <iframe
            id="ytplayer"
            src="${embedUrl}"
            frameborder="0"
            allow="autoplay; encrypted-media; picture-in-picture"
            allowfullscreen
          ></iframe>
        </body>
      </html>
    `
    : null;

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={handleClose}>
      <View style={styles.overlay}>
        <View style={styles.header}>
          {videoId ? (
            <TouchableOpacity style={styles.somButton} onPress={toggleSom}>
              <MaterialCommunityIcons
                name={somLigado ? 'volume-high' : 'volume-off'}
                size={18}
                color={colors.onPrimary}
              />
              <Text style={styles.somButtonText}>{somLigado ? 'Som ligado' : 'Som desligado'}</Text>
            </TouchableOpacity>
          ) : (
            <View />
          )}
          <TouchableOpacity style={styles.closeButton} onPress={handleClose}>
            <MaterialCommunityIcons name="close" size={20} color={colors.white} />
          </TouchableOpacity>
        </View>

        <View style={styles.videoWrap}>
          {playerHtml ? (
            <>
              <WebView
                ref={webviewRef}
                source={{ html: playerHtml, baseUrl: 'https://www.youtube.com' }}
                originWhitelist={['*']}
                style={styles.webview}
                allowsInlineMediaPlayback
                mediaPlaybackRequiresUserAction={false}
                javaScriptEnabled
                domStorageEnabled
                onLoadEnd={() => setCarregando(false)}
                onShouldStartLoadWithRequest={(req) =>
                  req.url.startsWith('about:') ||
                  req.url.startsWith('data:') ||
                  req.url.includes('youtube.com') ||
                  req.url.includes('ytimg.com') ||
                  req.url.includes('googlevideo.com')
                }
              />
              {carregando && (
                <View style={styles.loadingOverlay}>
                  <ActivityIndicator color={colors.primary} size="large" />
                </View>
              )}
            </>
          ) : (
            <View style={styles.semVideo}>
              <MaterialCommunityIcons name="video-off-outline" size={32} color={colors.onSurfaceVariant} />
              <Text style={styles.semVideoText}>
                {videoUrl
                  ? 'Não foi possível reconhecer o link desse vídeo do YouTube.'
                  : 'Esse exercício ainda não tem vídeo demonstrativo.'}
              </Text>
              {!!videoUrl && (
                <TouchableOpacity onPress={() => Linking.openURL(videoUrl)}>
                  <Text style={styles.abrirLink}>Abrir o link mesmo assim</Text>
                </TouchableOpacity>
              )}
            </View>
          )}
        </View>

        <Text style={styles.nomeExercicio}>{exercicioNome}</Text>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.95)', justifyContent: 'center' },
  header: {
    position: 'absolute',
    top: 50,
    left: spacing.md,
    right: spacing.md,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    zIndex: 2,
  },
  somButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.primary,
    borderRadius: radii.full,
    paddingHorizontal: spacing.md,
    paddingVertical: 8,
  },
  somButtonText: { ...typography.labelSm, color: colors.onPrimary, textTransform: 'none' },
  closeButton: {
    width: 34,
    height: 34,
    borderRadius: radii.full,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  videoWrap: { width: '100%', aspectRatio: 9 / 16, maxHeight: '75%' },
  webview: { flex: 1, backgroundColor: 'transparent' },
  loadingOverlay: {
    ...StyleSheet.absoluteFill,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background,
  },
  semVideo: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.lg, gap: spacing.sm },
  semVideoText: { ...typography.bodyMd, color: colors.onSurfaceVariant, textAlign: 'center' },
  abrirLink: { ...typography.labelMd, color: colors.primary, marginTop: spacing.sm },
  nomeExercicio: {
    ...typography.headlineSm,
    color: colors.onSurface,
    textAlign: 'center',
    marginTop: spacing.md,
  },
});

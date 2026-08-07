import { useState, useMemo } from 'react';
import { View, Text, FlatList, SectionList, StyleSheet, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Pencil, ShoppingCart } from 'lucide-react-native';
import { colors, spacing } from '@/theme/colors';
import { HeaderDieta } from '@/components/ui/HeaderDieta';
import { DiasTabs } from '@/components/ui/DiasTabs';
import { SemanaSelector } from '@/components/ui/SemanaSelector';
import { RefeicaoCardView } from '@/components/refeicao/RefeicaoCardView';
import { TotalDiaFooter } from '@/components/refeicao/TotalDiaFooter';
import { EmptyState } from '@/components/ui/EmptyState';
import { useDieta } from '@/stores/useDietasStore';
import { useDietasStore } from '@/stores/useDietasStore';
import { DietaTargetsCTA } from '@/features/tdee-wizard/components/DietaTargetsCTA';
import { useElementHeight } from '@/hooks/useElementHeight';
import { hap } from '@/utils/haptics';
import type { DiaSemana } from '@/types';
import { useShallow } from 'zustand/react/shallow';

// Componentes estáticos fora do render — evitam nova referência a cada ciclo
const SectionSep = () => <View style={{ height: spacing.lg }} />;
const ItemSep = () => <View style={{ height: spacing.md }} />;

export default function DietaVisualizar() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const dieta = useDieta(id);

  const [diaAtivo, setDiaAtivo] = useState<DiaSemana>('segunda');
  const [semanaAtiva, setSemanaAtiva] = useState(1);

  const duracao = dieta?.duracao ?? { tipo: 'indefinida' as const };
  const totalSemanas = dieta?.semanas.length ?? 1;
  const mostrarSemanas = totalSemanas > 1;

  // modo dias >7: exibe flat list de todos os dias da semana ativa
  const isDiasFlatList = duracao.tipo === 'dias' && (duracao.quantidade ?? 0) > 7;

  // IDs das refeições do dia ativo (para modo abas)
  const refeicaoIds = useDietasStore(
    useShallow((s) => {
      if (!id || isDiasFlatList) return [];
      const dia = s.byId[id]?.semanas
        .find((sem) => sem.numero === semanaAtiva)
        ?.dias.find((d) => d.nome === diaAtivo);
      return dia?.refeicoes.slice().sort((a, b) => a.ordem - b.ordem).map((r) => r.id) ?? [];
    })
  );

  // Dias da semana ativa — referências estáveis do store (evita Maximum update depth)
  const diasAtivos = useDietasStore(
    useShallow((s) => {
      if (!id || !isDiasFlatList) return [];
      const semana = s.byId[id]?.semanas.find((sem) => sem.numero === semanaAtiva);
      return semana?.dias ?? [];
    })
  );

  // Sections derivadas de forma estável — useMemo só roda quando diasAtivos muda
  const diasSections = useMemo(
    () =>
      diasAtivos.map((dia) => ({
        dia,
        data: dia.refeicoes.slice().sort((a, b) => a.ordem - b.ordem).map((r) => r.id),
      })),
    [diasAtivos],
  );

  const { height: footerH, onLayout: onFooterLayout } = useElementHeight();

  if (!dieta || !id) {
    return (
      <SafeAreaView style={styles.safe} edges={['top']}>
        <HeaderDieta titulo="Dieta não encontrada" onBack={() => router.back()} />
        <EmptyState title="Esta dieta não existe ou foi removida" />
      </SafeAreaView>
    );
  }

  const handleEditar = () => {
    hap.tap();
    router.push({ pathname: '/dieta/[id]/editar', params: { id } });
  };

  const handleListaCompras = () => {
    hap.tap();
    router.push(`/lista-compras/${id}` as any);
  };

  const handleChangeDia = (d: DiaSemana) => {
    hap.select();
    setDiaAtivo(d);
  };

  const handleChangeSemana = (n: number) => {
    setSemanaAtiva(n);
    // reset dia ao mudar semana
    setDiaAtivo('segunda');
  };

  // ─── Label do dia no modo flat list ──────────────────────────
  function labelDia(dia: typeof diasSections[0]['dia']): string {
    if (dia.indice !== undefined) return `Dia ${dia.indice}`;
    const nomes: Record<DiaSemana, string> = {
      segunda: 'Segunda-feira', terca: 'Terça-feira', quarta: 'Quarta-feira',
      quinta: 'Quinta-feira', sexta: 'Sexta-feira', sabado: 'Sábado', domingo: 'Domingo',
    };
    return nomes[dia.nome] ?? dia.nome;
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <HeaderDieta
        titulo={dieta.nome}
        onBack={() => router.back()}
        actions={
          <View style={styles.actionsRow}>
            <Pressable
              onPress={handleEditar}
              hitSlop={10}
              style={({ pressed }) => [styles.headerBtn, pressed && styles.headerBtnPressed]}
              accessibilityLabel="Editar dieta"
            >
              <Pencil size={18} color={colors.primary} strokeWidth={2.2} />
            </Pressable>
            <Pressable
              onPress={handleListaCompras}
              hitSlop={10}
              style={({ pressed }) => [styles.headerBtn, pressed && styles.headerBtnPressed]}
              accessibilityLabel="Lista de compras"
            >
              <ShoppingCart size={18} color={colors.primary} strokeWidth={2.2} />
            </Pressable>
          </View>
        }
      />

      {/* Seletor de semana (aparece quando há mais de 1 semana) */}
      {mostrarSemanas && (
        <SemanaSelector
          semanaAtiva={semanaAtiva}
          totalSemanas={totalSemanas}
          duracao={duracao}
          onChange={handleChangeSemana}
        />
      )}

      {/* Abas de dias (apenas quando não é flat list) */}
      {!isDiasFlatList && (
        <DiasTabs valor={diaAtivo} onChange={handleChangeDia} />
      )}

      <View style={styles.ctaWrap}>
        <DietaTargetsCTA dietaId={id} />
      </View>

      {/* ── Modo tabs: 1 dia de cada vez ── */}
      {!isDiasFlatList && (
        <FlatList
          data={refeicaoIds}
          keyExtractor={(rId) => rId}
          renderItem={({ item }) => (
            <RefeicaoCardView
              dietaId={id}
              dia={diaAtivo}
              refeicaoId={item}
              semanaNumero={semanaAtiva}
            />
          )}
          ItemSeparatorComponent={() => <View style={{ height: spacing.md }} />}
          contentContainerStyle={[
            styles.listContent,
            { paddingBottom: footerH + spacing.md },
          ]}
          ListEmptyComponent={
            <EmptyState
              title="Nenhuma refeição cadastrada"
              subtitle="Toque no ícone de lápis para editar este dia"
            />
          }
          showsVerticalScrollIndicator={false}
        />
      )}

      {/* ── Modo flat list: todos os dias da semana ── */}
      {isDiasFlatList && (
        <SectionList
          sections={diasSections}
          keyExtractor={(rId) => rId}
          stickySectionHeadersEnabled={false}
          renderSectionHeader={({ section }) => (
            <View style={styles.diaHeader}>
              <Text style={styles.diaHeaderText}>{labelDia(section.dia)}</Text>
            </View>
          )}
          renderItem={({ item, section }) => (
            <RefeicaoCardView
              dietaId={id}
              dia={section.dia.nome}
              refeicaoId={item}
              semanaNumero={semanaAtiva}
            />
          )}
          SectionSeparatorComponent={SectionSep}
          ItemSeparatorComponent={ItemSep}
          contentContainerStyle={[
            styles.listContent,
            { paddingBottom: footerH + spacing.md },
          ]}
          showsVerticalScrollIndicator={false}
        />
      )}

      <View style={styles.footerWrap} onLayout={onFooterLayout}>
        {!isDiasFlatList ? (
          <TotalDiaFooter dietaId={id} dia={diaAtivo} semanaNumero={semanaAtiva} />
        ) : null}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#FFFFFF' },
  actionsRow: { flexDirection: 'row', gap: 4 },
  headerBtn: {
    width: 36, height: 36, borderRadius: 18,
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: colors.primaryLight,
  },
  headerBtnPressed: { opacity: 0.7 },
  ctaWrap: { paddingHorizontal: spacing.screenH },
  listContent: {
    paddingHorizontal: spacing.screenH,
    paddingTop: spacing.xs,
    flexGrow: 1,
  },
  diaHeader: {
    paddingTop: spacing.sm,
    paddingBottom: spacing.xs,
  },
  diaHeaderText: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.text,
    letterSpacing: -0.2,
  },
  footerWrap: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
  },
});

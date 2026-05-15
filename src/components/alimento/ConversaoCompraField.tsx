import { memo, useEffect, useState } from 'react';
import { View, Text, TextInput, Switch, StyleSheet, Platform } from 'react-native';
import Animated, {
  useSharedValue, withTiming, FadeIn, FadeOut, Easing,
} from 'react-native-reanimated';
import { Info, AlertTriangle } from 'lucide-react-native';
import { colors, radii, spacing } from '@/theme/colors';
import type { UnidadeMedida } from '@/types';
import { hap } from '@/utils/haptics';

interface Props {
  unidade: UnidadeMedida;
  possuiFator: boolean;
  fatorPreparo: number | null;
  onChange: (possuiFator: boolean, fatorPreparo: number | null) => void;
}

/**
 * Ranges do INPUT do usuário (peso cru pra 100g preparado).
 *
 * Internamente, fatorPreparo = 100 / cru.
 *   cru=5     → fator 20  (limite superior)
 *   cru=1000  → fator 0.1 (limite inferior)
 *   cru=20    → fator 5   (acima disso: warning)
 *   cru=500   → fator 0.2 (abaixo disso: warning)
 */
const CRU_MIN = 5;
const CRU_MAX = 1000;
const CRU_WARN_MIN = 20;
const CRU_WARN_MAX = 500;

function fatorPreparoToCruText(fator: number | null): string {
  if (fator == null || fator <= 0 || !Number.isFinite(fator)) return '';
  return formatCru(100 / fator);
}

function formatCru(n: number): string {
  if (!Number.isFinite(n)) return '';
  if (Number.isInteger(n)) return String(n);
  return String(Math.round(n * 10) / 10).replace('.', ',');
}

function sanitizeInput(raw: string): string {
  const cleaned = raw.replace(/[^0-9.,]/g, '');
  let sepIdx = -1;
  let out = '';
  for (let i = 0; i < cleaned.length; i++) {
    const c = cleaned[i];
    if (c === ',' || c === '.') {
      if (sepIdx === -1) { sepIdx = i; out += c; }
    } else out += c;
  }
  const sep = out.search(/[.,]/);
  if (sep >= 0) {
    const inteiro = out.slice(0, sep).slice(0, 4);
    const decimal = out.slice(sep + 1).slice(0, 1);
    out = inteiro + out[sep] + decimal;
  } else {
    out = out.slice(0, 4);
  }
  return out;
}

function ConversaoCompraFieldBase({ unidade, possuiFator, fatorPreparo, onChange }: Props) {
  const [cruText, setCruText] = useState<string>(fatorPreparoToCruText(fatorPreparo));

  const expandProgress = useSharedValue(possuiFator ? 1 : 0);

  useEffect(() => {
    expandProgress.value = withTiming(possuiFator ? 1 : 0, {
      duration: 220, easing: Easing.out(Easing.cubic),
    });
  }, [possuiFator]);

  useEffect(() => {
    setCruText(fatorPreparoToCruText(fatorPreparo));
  }, [fatorPreparo]);

  const cruNum = (() => {
    if (!cruText.trim()) return null;
    const n = parseFloat(cruText.replace(',', '.'));
    if (!Number.isFinite(n) || n <= 0) return null;
    return n;
  })();

  const fatorCalculado = cruNum != null ? 100 / cruNum : null;
  const outOfRange = cruNum != null && (cruNum < CRU_MIN || cruNum > CRU_MAX);
  const isWarning =
    cruNum != null && !outOfRange && (cruNum < CRU_WARN_MIN || cruNum > CRU_WARN_MAX);

  const commit = () => {
    if (!possuiFator) return;
    if (cruNum == null || outOfRange) {
      onChange(true, null);
      return;
    }
    onChange(true, fatorCalculado);
  };

  const toggleSwitch = (val: boolean) => {
    hap.tap();
    if (val) {
      onChange(true, fatorPreparo);
    } else {
      setCruText('');
      onChange(false, null);
    }
  };

  // Preview: 200g preparado → X cru
  const exemploPrep = 200;
  const exemploCompra =
    fatorCalculado != null && !outOfRange
      ? Math.round((exemploPrep / fatorCalculado) * 10) / 10
      : null;
  const exemploCompraTxt =
    exemploCompra != null ? `${formatCru(exemploCompra)}${unidade}` : null;

  return (
    <View style={styles.wrap}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.headerTitle}>Conversão preparado → cru</Text>
          <Text style={styles.headerSubtitle}>
            Este alimento muda de peso ao preparar?
          </Text>
        </View>
        <Switch
          value={possuiFator}
          onValueChange={toggleSwitch}
          trackColor={{ false: colors.border, true: colors.primary }}
          thumbColor={Platform.OS === 'android' ? '#FFFFFF' : undefined}
          ios_backgroundColor={colors.border}
        />
      </View>

      {possuiFator && (
        <Animated.View
          entering={FadeIn.duration(200)}
          exiting={FadeOut.duration(140)}
          style={styles.body}
        >
          <View style={styles.infoBox}>
            <Info size={14} color={colors.primaryText} strokeWidth={2.2} />
            <Text style={styles.infoText}>
              Macros sempre representam o alimento <Text style={styles.infoBold}>preparado/pronto</Text>.
              {' '}Esta conversão afeta apenas a <Text style={styles.infoBold}>lista de compras</Text>.
            </Text>
          </View>

          <View style={styles.row}>
            <View style={styles.field}>
              <Text style={styles.label}>Preparado</Text>
              <View style={[styles.input, styles.inputReadonly]}>
                <Text style={styles.inputReadonlyText}>100{unidade}</Text>
              </View>
            </View>

            <View style={styles.equals}>
              <Text style={styles.equalsText}>equivale a</Text>
            </View>

            <View style={styles.field}>
              <Text style={styles.label}>Cru</Text>
              <View
                style={[
                  styles.input,
                  outOfRange && styles.inputError,
                  isWarning && styles.inputWarning,
                ]}
              >
                <TextInput
                  value={cruText}
                  onChangeText={(v) => setCruText(sanitizeInput(v))}
                  onBlur={commit}
                  onSubmitEditing={commit}
                  placeholder="Ex: 128"
                  placeholderTextColor={colors.textMuted}
                  keyboardType={Platform.OS === 'ios' ? 'decimal-pad' : 'numeric'}
                  inputMode="decimal"
                  returnKeyType="done"
                  maxLength={6}
                  style={styles.inputText}
                  allowFontScaling={false}
                />
                <Text style={styles.inputSuffix}>{unidade}</Text>
              </View>
            </View>
          </View>

          {outOfRange ? (
            <View style={styles.alertError}>
              <AlertTriangle size={14} color={colors.danger} strokeWidth={2.4} />
              <Text style={styles.alertErrorText}>
                Valor fora do intervalo aceito ({CRU_MIN}–{CRU_MAX}{unidade}).
                {' '}Será ignorado se você salvar agora.
              </Text>
            </View>
          ) : isWarning ? (
            <View style={styles.alertWarn}>
              <AlertTriangle size={14} color={colors.warning} strokeWidth={2.4} />
              <Text style={styles.alertWarnText}>
                Valor incomum. Confira se está correto.
              </Text>
            </View>
          ) : null}

          {exemploCompraTxt && (
            <View style={styles.preview}>
              <Text style={styles.previewLabel}>Lista de compras:</Text>
              <Text style={styles.previewText}>
                Para <Text style={styles.previewBold}>{exemploPrep}{unidade} preparado</Text>,
                comprar <Text style={styles.previewBold}>{exemploCompraTxt} cru</Text>
              </Text>
            </View>
          )}
        </Animated.View>
      )}
    </View>
  );
}

export const ConversaoCompraField = memo(ConversaoCompraFieldBase);

const styles = StyleSheet.create({
  wrap: {
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    borderRadius: radii.md,
    backgroundColor: '#FFFFFF',
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md - 2,
    minHeight: 56,
    gap: spacing.md,
  },
  headerLeft: { flex: 1, gap: 2 },
  headerTitle: { fontSize: 14, fontWeight: '600', color: colors.text },
  headerSubtitle: { fontSize: 12, color: colors.textSecondary },
  body: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
    paddingBottom: spacing.md,
    gap: spacing.md - 2,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
  },
  infoBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 6,
    paddingHorizontal: spacing.sm + 2,
    paddingVertical: spacing.sm,
    backgroundColor: colors.primaryLight,
    borderRadius: 8,
  },
  infoText: { flex: 1, fontSize: 12, lineHeight: 16, color: colors.primaryText },
  infoBold: { fontWeight: '700' },
  row: { flexDirection: 'row', alignItems: 'flex-end', gap: spacing.sm },
  field: { flex: 1, gap: 4 },
  label: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.textSecondary,
    letterSpacing: 0.1,
    textTransform: 'uppercase',
  },
  input: {
    height: 42,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: radii.md,
    paddingHorizontal: spacing.sm + 2,
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  inputReadonly: { backgroundColor: colors.surface, borderColor: colors.border },
  inputReadonlyText: { fontSize: 16, fontWeight: '600', color: colors.text },
  inputWarning: { borderColor: colors.warning },
  inputError: { borderColor: colors.danger },
  inputText: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    paddingVertical: 0,
  },
  inputSuffix: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textSecondary,
    marginLeft: 2,
  },
  equals: { paddingBottom: 10, alignSelf: 'flex-end', paddingHorizontal: 2 },
  equalsText: { fontSize: 11, fontWeight: '600', color: colors.textMuted, textAlign: 'center' },
  alertWarn: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 6,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.sm - 2,
    backgroundColor: '#FEF3C7',
    borderRadius: 8,
  },
  alertWarnText: { flex: 1, fontSize: 12, color: '#92400E', fontWeight: '500' },
  alertError: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 6,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.sm - 2,
    backgroundColor: colors.dangerLight,
    borderRadius: 8,
  },
  alertErrorText: { flex: 1, fontSize: 12, color: colors.danger, fontWeight: '500' },
  preview: {
    backgroundColor: colors.successLight,
    borderRadius: 8,
    paddingHorizontal: spacing.sm + 2,
    paddingVertical: spacing.sm,
    gap: 2,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#A7F3D0',
  },
  previewLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.successText,
    letterSpacing: 0.2,
    textTransform: 'uppercase',
  },
  previewText: { fontSize: 13, color: colors.successText, lineHeight: 18 },
  previewBold: { fontWeight: '700' },
});
import { apiClient, TRUSTED_DEMO_TOKEN } from './api-client';
import { resolveAIProvenance } from './provenance';
import axios from 'axios';

describe('AI Fallback & Truthful Live AI Behavior (Milestone 0A)', () => {
  const originalToken = apiClient.getToken();

  afterEach(() => {
    jest.restoreAllMocks();
  });

  afterAll(() => {
    if (originalToken) {
      apiClient.setToken(originalToken);
    } else {
      apiClient.logout();
    }
  });

  describe('1. Network failure handling for authenticated live user', () => {
    it('throws network error and NEVER returns simulated response or is_live_ai: true', async () => {
      // Simulate real authenticated user (non-demo)
      apiClient.setToken('verified-prod-jwt-token');
      expect(apiClient.isDemoSession()).toBe(false);

      const networkError = new axios.AxiosError(
        'Network Error',
        'ERR_NETWORK',
        undefined,
        undefined,
        undefined
      );
      jest.spyOn((apiClient as any).client, 'post').mockRejectedValue(networkError);

      await expect(
        apiClient.chatAI({ message: 'What is my current net cash flow?' })
      ).rejects.toThrow('Network Error');
    });

    it('rejects explainFinances without fabricating ledger metrics when offline', async () => {
      apiClient.setToken('verified-prod-jwt-token');
      const networkError = new axios.AxiosError('Network Error', 'ERR_NETWORK');
      jest.spyOn((apiClient as any).client, 'post').mockRejectedValue(networkError);

      await expect(apiClient.explainFinances()).rejects.toThrow('Network Error');
    });

    it('rejects askSpendingAssistant without fabricating cash flow data when offline', async () => {
      apiClient.setToken('verified-prod-jwt-token');
      const networkError = new axios.AxiosError('Network Error', 'ERR_NETWORK');
      jest.spyOn((apiClient as any).client, 'post').mockRejectedValue(networkError);

      await expect(
        apiClient.askSpendingAssistant({ question: 'Can I afford dinner?' })
      ).rejects.toThrow('Network Error');
    });

    it('rejects classifyTransaction without guessing when backend is offline', async () => {
      apiClient.setToken('verified-prod-jwt-token');
      const networkError = new axios.AxiosError('Network Error', 'ERR_NETWORK');
      jest.spyOn((apiClient as any).client, 'post').mockRejectedValue(networkError);

      await expect(
        apiClient.classifyTransaction({ description: 'Coffee shop' })
      ).rejects.toThrow('Network Error');
    });

    it('rejects simulateGoal without fabricating completion dates when offline', async () => {
      apiClient.setToken('verified-prod-jwt-token');
      const networkError = new axios.AxiosError('Network Error', 'ERR_NETWORK');
      jest.spyOn((apiClient as any).client, 'post').mockRejectedValue(networkError);

      await expect(
        apiClient.simulateGoal({
          goal_name: 'Emergency Fund',
          target_amount: '100000',
          current_savings: '20000',
          monthly_contribution: '5000',
        })
      ).rejects.toThrow('Network Error');
    });
  });

  describe('2. Unavailable backend handling (503 / 500 / timeout) for live user', () => {
    it('throws server error when backend returns 503 and does not mask it as live AI', async () => {
      apiClient.setToken('verified-prod-jwt-token');
      const serverError = new axios.AxiosError(
        'Service Unavailable',
        'ERR_BAD_RESPONSE',
        undefined,
        undefined,
        {
          status: 503,
          statusText: 'Service Unavailable',
          data: { detail: 'AI provider is temporarily overloaded' },
          headers: {},
          config: {} as any,
        }
      );
      jest.spyOn((apiClient as any).client, 'post').mockRejectedValue(serverError);

      await expect(
        apiClient.chatAI({ message: 'Analyze my expenses' })
      ).rejects.toThrow('Service Unavailable');
    });

    it('rejects listAIConversations on server failure without injecting demo conversations', async () => {
      apiClient.setToken('verified-prod-jwt-token');
      const serverError = new axios.AxiosError('Internal Server Error', 'ERR_BAD_RESPONSE');
      jest.spyOn((apiClient as any).client, 'get').mockRejectedValue(serverError);

      await expect(apiClient.listAIConversations()).rejects.toThrow('Internal Server Error');
    });
  });

  describe('3. Explicit demo mode behavior', () => {
    beforeEach(() => {
      apiClient.setToken(TRUSTED_DEMO_TOKEN);
      expect(apiClient.isDemoSession()).toBe(true);
    });

    afterEach(() => {
      apiClient.setDemoSession(false);
    });

    it('returns simulated response with is_live_ai: false and explicit demo prefix', async () => {
      const networkError = new axios.AxiosError('Network Error', 'ERR_NETWORK');
      jest.spyOn((apiClient as any).client, 'post').mockRejectedValue(networkError);

      const res = await apiClient.chatAI({ message: 'What is my budget status?' });
      const data = res.data;

      // Acceptance criterion: No network-failure fallback sets is_live_ai: true
      expect(data.is_live_ai).toBe(false);
      expect(data.model_used).toBe('finroq-demo-simulated');
      expect(data.message).toContain('[Simulated Demo]');
      expect(data.structured_data?.is_simulated).toBe(true);
      expect(data.structured_data?.data_freshness).toContain('Simulated Demo');
    });

    it('marks explainFinances in demo mode as is_ai_generated: false and simulated_demo', async () => {
      const networkError = new axios.AxiosError('Network Error', 'ERR_NETWORK');
      jest.spyOn((apiClient as any).client, 'post').mockRejectedValue(networkError);

      const res = await apiClient.explainFinances();
      expect(res.data.is_ai_generated).toBe(false);
      expect(res.data.provider_status).toBe('simulated_demo');
      expect(res.data.explanation).toContain('[Simulated Demo]');
    });

    it('returns simulated demo conversation with is_live_ai: false in demo mode', async () => {
      const networkError = new axios.AxiosError('Network Error', 'ERR_NETWORK');
      jest.spyOn((apiClient as any).client, 'get').mockRejectedValue(networkError);

      const res = await apiClient.getAIConversation('demo-conv-1');
      expect(res.data.title).toContain('[Demo]');
      const assistantMsg = res.data.messages.find((m: { role: string }) => m.role === 'assistant');
      expect(assistantMsg?.content).toContain('[Simulated Demo]');
      expect(assistantMsg?.is_live_ai).toBe(false);
    });
  });

  describe('4. Truthful live-AI preservation when backend is reachable', () => {
    it('passes through genuine live backend response with is_live_ai: true unaltered', async () => {
      apiClient.setToken('verified-prod-jwt-token');

      const liveBackendResponse = {
        data: {
          conversation_id: 'real-conv-999',
          message: 'Analysis of your live ledger: you spent ₹12,000 on essentials.',
          is_live_ai: true,
          model_used: 'gemini-2.5-flash',
          structured_data: {
            total_income: '200000.00',
            total_expenses: '12000.00',
            net_cash_flow: '188000.00',
            liquid_cash_available: '150000.00',
            data_freshness: 'Real-time verified ledger',
          },
          tools_executed: [
            {
              tool: 'get_financial_summary',
              arguments: {},
              result: { total_income: '200000.00' },
            },
          ],
          created_at: new Date().toISOString(),
        },
      };

      jest.spyOn((apiClient as any).client, 'post').mockResolvedValue(liveBackendResponse);

      const res = await apiClient.chatAI({ message: 'Analyze my expenses' });
      expect(res.data.is_live_ai).toBe(true);
      expect(res.data.model_used).toBe('gemini-2.5-flash');
      expect(res.data.message).toBe('Analysis of your live ledger: you spent ₹12,000 on essentials.');
      expect(res.data.conversation_id).toBe('real-conv-999');
    });

    it('passes through unconfigured/deterministic backend fallback with is_live_ai: false', async () => {
      apiClient.setToken('verified-prod-jwt-token');

      const unconfiguredBackendResponse = {
        data: {
          conversation_id: 'real-conv-1000',
          message: 'Deterministic fallback summary from backend ledger math.',
          is_live_ai: false,
          model_used: 'deterministic-fallback',
          structured_data: null,
          tools_executed: [],
          created_at: new Date().toISOString(),
        },
      };

      jest.spyOn((apiClient as any).client, 'post').mockResolvedValue(unconfiguredBackendResponse);

      const res = await apiClient.chatAI({ message: 'Analyze my expenses' });
      expect(res.data.is_live_ai).toBe(false);
      expect(res.data.model_used).toBe('deterministic-fallback');
    });
  });

  describe('5. Harden AI Provenance & Session Mode Isolation (Milestone 0A.1)', () => {
    it('does NOT treat arbitrary tokens containing "demo" substring as demo mode', () => {
      // Security / Integrity check: Substring matching vulnerability closed
      apiClient.setToken('user-jwt-containing-demo-keyword-in-payload');
      expect(apiClient.isDemoSession()).toBe(false);

      apiClient.setToken('demo_user_custom_token');
      expect(apiClient.isDemoSession()).toBe(false);

      apiClient.setToken('bearer-demo-12345');
      expect(apiClient.isDemoSession()).toBe(false);
    });

    it('explicitly enters demo session only via TRUSTED_DEMO_TOKEN or setDemoSession', () => {
      apiClient.setToken(TRUSTED_DEMO_TOKEN);
      expect(apiClient.isDemoSession()).toBe(true);

      apiClient.setDemoSession(false);
      expect(apiClient.isDemoSession()).toBe(false);

      apiClient.setDemoSession(true);
      expect(apiClient.isDemoSession()).toBe(true);
      expect(apiClient.getToken()).toBe(TRUSTED_DEMO_TOKEN);

      apiClient.logout();
      expect(apiClient.isDemoSession()).toBe(false);
      expect(apiClient.getToken()).toBeNull();
    });

    describe('resolveAIProvenance: Separation of session mode, data provenance, and AI execution', () => {
      it('classifies genuine live AI provider response with verified ledger context', () => {
        const prov = resolveAIProvenance(
          {
            content: 'Your savings rate improved by 4%.',
            is_live_ai: true,
            model_used: 'gemini-2.5-flash',
            structured_data: {
              data_freshness: 'Real-time verified ledger',
              liquid_cash_available: '50000.00',
            },
            tools_executed: [
              { tool: 'get_financial_summary', arguments: {}, result: {} },
            ],
          },
          false, // isDemoSession
          false  // isGuestMode
        );

        expect(prov.sessionMode).toBe('authenticated');
        expect(prov.executionType).toBe('live_provider');
        expect(prov.dataProvenance).toBe('verified_ledger');
        expect(prov.executionBadgeLabel).toBe('Live AI · gemini-2.5-flash');
        expect(prov.provenanceBadgeLabel).toBe('Verified Ledger Context');
        expect(prov.isLiveAI).toBe(true);
        expect(prov.isDeterministic).toBe(false);
        expect(prov.isSimulated).toBe(false);
      });

      it('classifies deterministic backend response without labeling as external provider', () => {
        const prov = resolveAIProvenance(
          {
            content: 'Summary calculation based on backend rules.',
            is_live_ai: false,
            model_used: 'deterministic-rules-engine',
            structured_data: null,
            tools_executed: [],
          },
          false,
          false
        );

        expect(prov.sessionMode).toBe('authenticated');
        expect(prov.executionType).toBe('deterministic_backend');
        expect(prov.executionBadgeLabel).toBe('Deterministic Engine');
        expect(prov.isLiveAI).toBe(false);
        expect(prov.isDeterministic).toBe(true);
        expect(prov.isSimulated).toBe(false);
        // Acceptance criterion: does not claim verified ledger without verified data
        expect(prov.dataProvenance).toBe('no_ledger_context');
        expect(prov.provenanceBadgeLabel).toBeUndefined();
      });

      it('does NOT infer verified ledger provenance merely from authenticated session', () => {
        const prov = resolveAIProvenance(
          {
            content: 'Generic financial advice about emergency funds.',
            is_live_ai: true,
            model_used: 'gemini-2.5-flash',
            // No structured ledger data and no tool executions
            structured_data: null,
            tools_executed: [],
          },
          false,
          false
        );

        expect(prov.sessionMode).toBe('authenticated');
        expect(prov.executionType).toBe('live_provider');
        // Provenance must be no_ledger_context since no verified data was accessed
        expect(prov.dataProvenance).toBe('no_ledger_context');
        expect(prov.provenanceBadgeLabel).toBeUndefined();
      });

      it('classifies simulated demo session with explicit simulated labels', () => {
        const prov = resolveAIProvenance(
          {
            content: '[Simulated Demo] Here is sample financial data.',
            is_live_ai: false,
            model_used: 'finroq-demo-simulated',
            structured_data: {
              data_freshness: 'Simulated Demo (Sample Ledger)',
              is_simulated: true,
            },
          },
          true, // isDemoSession
          false
        );

        expect(prov.sessionMode).toBe('demo');
        expect(prov.executionType).toBe('simulated_demo');
        expect(prov.dataProvenance).toBe('simulated_demo');
        expect(prov.executionBadgeLabel).toBe('Simulated Demo');
        expect(prov.provenanceBadgeLabel).toBe('Sample Demo Ledger');
        expect(prov.isLiveAI).toBe(false);
        expect(prov.isSimulated).toBe(true);
      });

      it('classifies public guest mode as static guide', () => {
        const prov = resolveAIProvenance(
          {
            content: 'FINROQ is a financial platform...',
            is_live_ai: false,
            model_used: 'finroq-static-guide',
          },
          false,
          true // isGuestMode
        );

        expect(prov.sessionMode).toBe('guest');
        expect(prov.executionType).toBe('static_guide');
        expect(prov.executionBadgeLabel).toBe('Public Guide');
        expect(prov.dataProvenance).toBe('no_ledger_context');
      });

      it('handles unavailable or unconfigured provider safely without claiming live AI', () => {
        const prov = resolveAIProvenance(
          {
            content: 'Backend AI provider is not configured.',
            is_live_ai: false,
            model_used: 'unconfigured',
          },
          false,
          false
        );

        expect(prov.executionType).toBe('unavailable');
        expect(prov.executionBadgeLabel).toBe('Provider Unavailable');
        expect(prov.isLiveAI).toBe(false);
      });
    });
  });
});

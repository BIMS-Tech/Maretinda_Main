import { Container, Heading, Text, Button, Badge } from "@medusajs/ui"
import { ExternalLink, CheckCircle, Clock, AlertTriangle } from "@medusajs/icons"

interface ProviderGuide {
  providerId: string
  name: string
  logo?: string
  estimatedSetupTime: string
  difficulty: 'Easy' | 'Medium' | 'Advanced'
  requirements: string[]
  benefits: string[]
  steps: {
    title: string
    description: string
    link?: string
    tips?: string[]
  }[]
  troubleshooting: {
    issue: string
    solution: string
  }[]
}

const providerGuides: ProviderGuide[] = [
  {
    providerId: "lalamove",
    name: "Lalamove",
    estimatedSetupTime: "15-30 minutes",
    difficulty: "Easy",
    requirements: [
      "Valid business registration",
      "Business address in supported market",
      "Contact phone number",
      "Email address"
    ],
    benefits: [
      "Same-day delivery across Asia",
      "Real-time tracking",
      "Competitive rates for short distances",
      "Multiple vehicle types available"
    ],
    steps: [
      {
        title: "1. Create Partner Account",
        description: "Visit the Lalamove Partner portal and sign up for a business account",
        link: "https://partner.lalamove.com/register",
        tips: [
          "Use your official business email",
          "Ensure your business address matches your registration documents",
          "Have your business registration number ready"
        ]
      },
      {
        title: "2. Complete Business Verification",
        description: "Upload required business documents and wait for approval (1-3 business days)",
        tips: [
          "Upload clear, high-quality document scans",
          "Ensure all documents are current and valid",
          "Business address must match operational location"
        ]
      },
      {
        title: "3. Access Developer Settings",
        description: "Once approved, navigate to Developer Settings in your partner dashboard",
        link: "https://partner.lalamove.com/dashboard",
        tips: [
          "Look for 'Developer' or 'API' section in the main menu",
          "You may need to request API access from support"
        ]
      },
      {
        title: "4. Generate API Credentials",
        description: "Create new API key and copy both the key and secret",
        tips: [
          "⚠️ API secret is shown only once - save it securely",
          "Consider using a password manager",
          "Name your API key for easy identification"
        ]
      }
    ],
    troubleshooting: [
      {
        issue: "Can't find Developer Settings",
        solution: "Contact Lalamove partner support to enable API access for your account"
      },
      {
        issue: "Business verification taking too long",
        solution: "Check document quality and completeness. Contact support with your application reference number"
      },
      {
        issue: "API key not working",
        solution: "Ensure you're using the correct market code and that your account is fully verified"
      }
    ]
  },
  {
    providerId: "jnt",
    name: "J&T Express",
    estimatedSetupTime: "20-45 minutes",
    difficulty: "Medium",
    requirements: [
      "Business registration documents",
      "Physical pickup location",
      "Bank account details",
      "Valid ID of business owner"
    ],
    benefits: [
      "Extensive coverage across Southeast Asia",
      "Cash on Delivery (COD) services",
      "Competitive express delivery rates",
      "Insurance options available"
    ],
    steps: [
      {
        title: "1. Register as Merchant",
        description: "Create account at J&T Express merchant portal",
        link: "https://merchant.jtexpress.com/register",
        tips: [
          "Prepare business registration certificate",
          "Have physical address for pickup location",
          "Business owner's valid government ID required"
        ]
      },
      {
        title: "2. Submit Required Documents",
        description: "Upload business registration, ID, and bank account information",
        tips: [
          "Documents must be clear and legible",
          "Bank account must be under business name",
          "Provide accurate pickup location address"
        ]
      },
      {
        title: "3. Wait for Account Approval",
        description: "J&T will review your application (2-5 business days)",
        tips: [
          "Check email regularly for approval notifications",
          "Respond quickly to any document requests",
          "Contact local J&T office for faster processing"
        ]
      },
      {
        title: "4. Access API Management",
        description: "Once approved, generate API credentials in the merchant portal",
        link: "https://merchant.jtexpress.com/dashboard",
        tips: [
          "Navigate to Settings → API Management",
          "Copy your Customer Code from Account Info",
          "Test credentials with sample API calls"
        ]
      }
    ],
    troubleshooting: [
      {
        issue: "Documents rejected",
        solution: "Ensure all documents are current, clear, and match the business name exactly"
      },
      {
        issue: "No API access after approval",
        solution: "Contact J&T merchant support to enable API access for your account"
      },
      {
        issue: "Customer code not working",
        solution: "Verify your customer code in Account Info section and ensure account is fully activated"
      }
    ]
  },
  {
    providerId: "ninjavan",
    name: "Ninja Van",
    estimatedSetupTime: "25-40 minutes", 
    difficulty: "Medium",
    requirements: [
      "Business registration number",
      "Physical business address",
      "Business contact information",
      "Banking details"
    ],
    benefits: [
      "Same-day and next-day delivery",
      "Real-time tracking and notifications",
      "Flexible pickup locations",
      "Volume-based pricing discounts"
    ],
    steps: [
      {
        title: "1. Register Shipper Account",
        description: "Sign up at Ninja Van shipper portal with business details",
        link: "https://shipper.ninjavan.co/register",
        tips: [
          "Use business registration number for verification",
          "Provide accurate business contact information",
          "Set up primary pickup location address"
        ]
      },
      {
        title: "2. Complete Business Onboarding",
        description: "Upload required documents and verify business information",
        tips: [
          "Business registration certificate required",
          "Provide clear pickup location details",
          "Set up default packaging preferences"
        ]
      },
      {
        title: "3. Account Verification",
        description: "Wait for Ninja Van to verify your business (1-3 business days)",
        tips: [
          "Monitor email for verification updates",
          "Ensure all contact information is accurate",
          "Respond promptly to any verification requests"
        ]
      },
      {
        title: "4. Generate API Credentials", 
        description: "Access Developer Settings to create API keys",
        link: "https://shipper.ninjavan.co/dashboard",
        tips: [
          "Navigate to Settings → Developer section",
          "Generate both API key and client credentials",
          "Store client secret securely (shown only once)"
        ]
      }
    ],
    troubleshooting: [
      {
        issue: "Business verification failed",
        solution: "Ensure business registration number is valid and matches official records"
      },
      {
        issue: "Can't access Developer Settings",
        solution: "Complete business verification first, then contact support to enable API access"
      },
      {
        issue: "Multiple pickup locations",
        solution: "Set up additional pickup points in Account Settings after initial verification"
      }
    ]
  }
]

const getDifficultyColor = (difficulty: string) => {
  switch (difficulty) {
    case 'Easy': return 'green'
    case 'Medium': return 'orange'
    case 'Advanced': return 'red'
    default: return 'grey'
  }
}

export const ShippingProviderGuide = ({ providerId }: { providerId?: string }) => {
  const guide = providerId ? providerGuides.find(g => g.providerId === providerId) : null

  if (guide) {
    // Single provider guide
    return (
      <Container className="p-0">
        <div className="p-6">
          <div className="flex items-center gap-4 mb-6">
            <div>
              <Heading level="h2">{guide.name} Setup Guide</Heading>
              <div className="flex items-center gap-4 mt-2">
                <Badge color={getDifficultyColor(guide.difficulty)} size="small">
                  {guide.difficulty}
                </Badge>
                <div className="flex items-center gap-1 text-sm text-ui-fg-muted">
                  <Clock className="h-4 w-4" />
                  {guide.estimatedSetupTime}
                </div>
              </div>
            </div>
          </div>

          {/* Requirements */}
          <div className="mb-6 p-4 bg-ui-bg-subtle rounded-lg">
            <Text className="font-medium mb-3">📋 What You'll Need</Text>
            <ul className="space-y-1">
              {guide.requirements.map((req, index) => (
                <li key={index} className="flex items-center gap-2 text-sm">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  {req}
                </li>
              ))}
            </ul>
          </div>

          {/* Benefits */}
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
            <Text className="font-medium text-green-900 mb-3">✨ Benefits</Text>
            <ul className="space-y-1">
              {guide.benefits.map((benefit, index) => (
                <li key={index} className="flex items-center gap-2 text-sm text-green-800">
                  <span className="w-1.5 h-1.5 bg-green-600 rounded-full"></span>
                  {benefit}
                </li>
              ))}
            </ul>
          </div>

          {/* Step-by-step guide */}
          <div className="mb-6">
            <Heading level="h3" className="mb-4">Step-by-Step Setup</Heading>
            <div className="space-y-6">
              {guide.steps.map((step, index) => (
                <div key={index} className="flex gap-4">
                  <div className="flex-shrink-0 w-8 h-8 bg-blue-100 text-blue-700 rounded-full flex items-center justify-center font-semibold text-sm">
                    {index + 1}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <Text className="font-medium">{step.title}</Text>
                      {step.link && (
                        <a
                          href={step.link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:text-blue-800"
                        >
                          <ExternalLink className="h-4 w-4" />
                        </a>
                      )}
                    </div>
                    <Text className="text-sm text-ui-fg-muted mb-2">{step.description}</Text>
                    {step.tips && (
                      <div className="mt-2">
                        <Text className="text-xs font-medium text-ui-fg-subtle mb-1">💡 Tips:</Text>
                        <ul className="space-y-1">
                          {step.tips.map((tip, tipIndex) => (
                            <li key={tipIndex} className="text-xs text-ui-fg-muted">
                              • {tip}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Troubleshooting */}
          <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <div className="flex items-center gap-2 mb-3">
              <AlertTriangle className="h-5 w-5 text-yellow-600" />
              <Text className="font-medium text-yellow-900">Common Issues & Solutions</Text>
            </div>
            <div className="space-y-3">
              {guide.troubleshooting.map((item, index) => (
                <div key={index}>
                  <Text className="text-sm font-medium text-yellow-900 mb-1">
                    Q: {item.issue}
                  </Text>
                  <Text className="text-sm text-yellow-800">
                    A: {item.solution}
                  </Text>
                </div>
              ))}
            </div>
          </div>
        </div>
      </Container>
    )
  }

  // Overview of all providers
  return (
    <Container className="p-0">
      <div className="p-6">
        <Heading level="h2" className="mb-4">Shipping Provider Setup Guides</Heading>
        <Text className="text-ui-fg-muted mb-6">
          Complete guides to help you set up your shipping provider accounts and obtain API credentials.
        </Text>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {providerGuides.map((guide) => (
            <div key={guide.providerId} className="border rounded-lg p-4 hover:border-ui-border-strong transition-colors">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <Text className="font-semibold">{guide.name}</Text>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge color={getDifficultyColor(guide.difficulty)} size="2xsmall">
                      {guide.difficulty}
                    </Badge>
                    <Text className="text-xs text-ui-fg-muted">{guide.estimatedSetupTime}</Text>
                  </div>
                </div>
              </div>

              <Text className="text-sm text-ui-fg-muted mb-4">
                {guide.benefits[0]}
              </Text>

              <div className="space-y-2">
                <Text className="text-xs font-medium text-ui-fg-subtle">Requirements:</Text>
                <ul className="space-y-1">
                  {guide.requirements.slice(0, 2).map((req, index) => (
                    <li key={index} className="text-xs text-ui-fg-muted flex items-center gap-1">
                      <span className="w-1 h-1 bg-ui-fg-muted rounded-full"></span>
                      {req}
                    </li>
                  ))}
                  {guide.requirements.length > 2 && (
                    <li className="text-xs text-ui-fg-muted">
                      +{guide.requirements.length - 2} more...
                    </li>
                  )}
                </ul>
              </div>

              <Button
                variant="secondary"
                size="small"
                className="w-full mt-4"
                onClick={() => {
                  // In real implementation, this would navigate to the detailed guide
                  console.log(`View guide for ${guide.name}`)
                }}
              >
                View Setup Guide
              </Button>
            </div>
          ))}
        </div>
      </div>
    </Container>
  )
}































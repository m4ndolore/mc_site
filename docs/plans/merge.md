                   Summary                                                                                                                                      
                                                                                                                                                    
       The signal-incubator project contains two production applications:                                                                           
                                                                                                                                                    
       1. MC Console (Defense Builders Dashboard) - React app with VIA authentication, deployed to Cloudflare Workers, accessible at port 3003      
       2. Wingman Dashboard - React app with direct Matrix Synapse authentication, runs on port 5173, provides Signal message analysis with AI      
       advisor                                                                                                                                      
                                                                                                                                                    
       Both apps share UI components and types, with deployment infrastructure supporting local Docker-based development and cloud deployment t     
        Cloudflare. The project is actively developing an Insights API on Cloudflare Workers for real-time insight delivery.  